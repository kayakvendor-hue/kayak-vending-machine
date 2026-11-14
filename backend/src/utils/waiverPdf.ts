import path from 'path';
import fs from 'fs/promises';
import { PDFDocument, PDFForm, PDFPage } from 'pdf-lib';

const TEMPLATE_PATH = path.join(__dirname, '../../assets/waiver-template.pdf');

// Template pages (0-based) that hold each signature widget.
const SIGNATURE_PAGES: Record<string, number> = {
    renter_signature: 3,
    guardian_signature: 5
};


// The template only has room for three minors.
export const MAX_MINORS_ON_TEMPLATE = 3;

export interface WaiverRenterData {
    fullName?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    emergencyContact?: {
        name?: string | null;
        relationship?: string | null;
        phone?: string | null;
    } | null;
}

export interface WaiverPdfRenter {
    renter?: WaiverRenterData | null;
    signature?: string | null;
    dateSigned?: Date | null;
}

export interface WaiverPdfMinor {
    name?: string | null;
    dateOfBirth?: Date | null;
}

export interface WaiverPdfGuardian {
    fullName?: string | null;
    relationship?: string | null;
    phone?: string | null;
    signature?: string | null;
    date?: Date | null;
}

export interface MainWaiverPdfInput extends WaiverPdfRenter {
    minors?: WaiverPdfMinor[];
    guardian?: WaiverPdfGuardian | null;
}

const formatDate = (value?: Date | null): string => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const setText = (form: PDFForm, name: string, value?: string | null) => {
    if (!value) return;
    form.getTextField(name).setText(value);
};

const checkBox = (form: PDFForm, name: string) => {
    form.getCheckBox(name).check();
};

// Decodes a PNG data URL (as produced by SignaturePad) into bytes.
const decodePngDataUrl = (dataUrl?: string | null): Uint8Array | null => {
    if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) return null;
    return Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64');
};


const drawSignature = async (
    pdf: PDFDocument,
    form: PDFForm,
    fieldName: string,
    dataUrl?: string | null
) => {
    const png = decodePngDataUrl(dataUrl);
    if (!png) return;

    const widget = form.getFieldMaybe(fieldName)?.acroField.getWidgets()[0];
    if (!widget) return;

    const page: PDFPage | undefined = pdf.getPages()[SIGNATURE_PAGES[fieldName]];
    if (!page) return;

    const image = await pdf.embedPng(png);
    const rect = widget.getRectangle();
    // Fit the signature inside its box, keeping the aspect ratio.
    const scale = Math.min(rect.width / image.width, rect.height / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    page.drawImage(image, {
        x: rect.x + (rect.width - width) / 2,
        y: rect.y + (rect.height - height) / 2,
        width,
        height
    });
};

const loadTemplate = async (): Promise<PDFDocument> => {
    const bytes = await fs.readFile(TEMPLATE_PATH);
    return PDFDocument.load(bytes);
};

const fillRenterBlock = (form: PDFForm, renterData?: WaiverRenterData | null, dateSigned?: Date | null) => {
    const renter = renterData ?? {};
    checkBox(form, 'renter_agree');
    checkBox(form, 'renter_safety_video');
    setText(form, 'renter_date', formatDate(dateSigned));
    setText(form, 'renter_name', renter.fullName);
    setText(form, 'renter_address', renter.address);
    setText(form, 'renter_phone', renter.phone);
    setText(form, 'renter_email', renter.email);
    setText(form, 'emergency_name', renter.emergencyContact?.name);
    setText(form, 'emergency_relationship', renter.emergencyContact?.relationship);
    setText(form, 'emergency_phone', renter.emergencyContact?.phone);
};


// Signatures are drawn directly onto the page, so the empty signature fields are detached
// before flattening (pdf-lib cannot flatten widgets that have no appearance).
const removeSignatureField = (pdf: PDFDocument, form: PDFForm, fieldName: string) => {
    const acroField = form.getFieldMaybe(fieldName)?.acroField;
    if (!acroField) return;

    const annots = pdf.getPages()[SIGNATURE_PAGES[fieldName]]?.node.Annots();
    if (annots) {
        const widgetDicts = acroField.getWidgets().map(w => w.dict);
        for (let i = annots.size() - 1; i >= 0; i--) {
            if (widgetDicts.includes(pdf.context.lookup(annots.get(i)) as never)) annots.remove(i);
        }
    }
    form.acroForm.removeField(acroField);
};

const finish = async (pdf: PDFDocument, form: PDFForm): Promise<Uint8Array> => {
    for (const name of Object.keys(SIGNATURE_PAGES)) {
        removeSignatureField(pdf, form, name);
    }
    form.updateFieldAppearances();
    form.flatten();
    return pdf.save();
};



// Full waiver for the account holder, including up to three minors and their guardian.
export const buildMainWaiverPdf = async (input: MainWaiverPdfInput): Promise<Uint8Array> => {
    const pdf = await loadTemplate();
    const form = pdf.getForm();

    fillRenterBlock(form, input.renter, input.dateSigned);

    (input.minors || []).slice(0, MAX_MINORS_ON_TEMPLATE).forEach((minor, i) => {
        const n = i + 1;
        setText(form, `minor${n}_name`, minor.name);
        setText(form, `minor${n}_dob`, formatDate(minor.dateOfBirth));
    });

    if (input.guardian) {
        checkBox(form, 'guardian_agree');
        setText(form, 'guardian_date', formatDate(input.guardian.date));
        setText(form, 'guardian_name', input.guardian.fullName);
        setText(form, 'guardian_relationship', input.guardian.relationship);
        setText(form, 'guardian_phone', input.guardian.phone);
        await drawSignature(pdf, form, 'guardian_signature', input.guardian.signature);
    }

    await drawSignature(pdf, form, 'renter_signature', input.signature);

    return finish(pdf, form);
};

// Waiver for an additional adult rider. Only the renter block is filled.
export interface RentalWaiverSource {
    createdAt?: Date | null;
    additionalRiders?: Array<{ riderType?: string | null; name?: string | null; dateOfBirth?: Date | null }> | null;
    guardianDetails?: { fullName?: string | null; relationship?: string | null; phone?: string | null } | null;
    guardianSignatureForMinors?: string | null;
}

// Builds the full account-holder waiver for a rental, including minors and guardian block
export const buildRentalWaiverPdf = (rental: RentalWaiverSource, waiver: WaiverPdfRenter): Promise<Uint8Array> => {
    const children = (rental.additionalRiders || []).filter(r => r.riderType === 'child');
    const guardian = rental.guardianDetails && rental.guardianSignatureForMinors
        ? {
            fullName: rental.guardianDetails.fullName,
            relationship: rental.guardianDetails.relationship,
            phone: rental.guardianDetails.phone,
            signature: rental.guardianSignatureForMinors,
            date: rental.createdAt
        }
        : undefined;

    return buildMainWaiverPdf({
        renter: waiver.renter,
        signature: waiver.signature,
        dateSigned: waiver.dateSigned,
        minors: children.map(c => ({ name: c.name, dateOfBirth: c.dateOfBirth })),
        guardian
    });
};

export const buildAdultRiderWaiverPdf = async (input: WaiverPdfRenter): Promise<Uint8Array> => {
    const pdf = await loadTemplate();
    const form = pdf.getForm();

    fillRenterBlock(form, input.renter, input.dateSigned);
    await drawSignature(pdf, form, 'renter_signature', input.signature);

    return finish(pdf, form);
};

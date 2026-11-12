import fs from 'fs';
import path from 'path';
import { PDFDocument, PDFPage } from 'pdf-lib';

export interface WaiverMinorInput {
    name: string;
    dateOfBirth: string;
}

export interface WaiverGuardianInput {
    name: string;
    relationship: string;
    phone: string;
    signature: string;
}

export interface WaiverFormInput {
    renterName: string;
    address: string;
    phone: string;
    email: string;
    emergencyName: string;
    emergencyRelationship: string;
    emergencyPhone: string;
    minors: WaiverMinorInput[];
    guardian?: WaiverGuardianInput;
}

const TEMPLATE_PATH = path.resolve(__dirname, '../../assets/waiver-template.pdf');

// 0-based page indexes of the two signature fields in the template.
const RENTER_SIGNATURE_PAGE = 3;
const GUARDIAN_SIGNATURE_PAGE = 5;

// Signature field rectangles from the template ([x1, y1, x2, y2] in PDF points).
const RENTER_SIGNATURE_RECT = { x: 124, y: 507, width: 250, height: 38 };
const GUARDIAN_SIGNATURE_RECT = { x: 124, y: 458, width: 250, height: 38 };

const DISPLAY_TIME_ZONE = 'America/New_York';

const formatDate = (value: Date | string): string => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('en-US', { timeZone: DISPLAY_TIME_ZONE });
};

// Date-only strings (YYYY-MM-DD) are parsed as UTC midnight, so format them in UTC to avoid shifting a day.
const formatBirthDate = (value: string): string => {
    return new Date(value).toLocaleDateString('en-US', { timeZone: 'UTC' });
};

const drawSignature = async (
    pdfDoc: PDFDocument,
    page: PDFPage,
    rect: { x: number; y: number; width: number; height: number },
    signatureDataUrl: string
) => {
    const base64 = signatureDataUrl.split(',')[1];
    const image = await pdfDoc.embedPng(Buffer.from(base64, 'base64'));
    const scale = Math.min((rect.width - 8) / image.width, (rect.height - 8) / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    page.drawImage(image, {
        x: rect.x + (rect.width - width) / 2,
        y: rect.y + (rect.height - height) / 2,
        width,
        height,
    });
};

// Fills the template's form fields, flattens them, and stamps the drawn signatures onto the signature areas.
export const buildSignedWaiverPdf = async (
    input: WaiverFormInput,
    renterSignatureDataUrl: string,
    signedAt: Date
): Promise<Buffer> => {
    const pdfDoc = await PDFDocument.load(fs.readFileSync(TEMPLATE_PATH));
    const form = pdfDoc.getForm();
    const today = formatDate(signedAt);

    const setText = (fieldName: string, value: string) => form.getTextField(fieldName).setText(value);

    setText('renter_date', today);
    setText('renter_name', input.renterName);
    setText('renter_address', input.address);
    setText('renter_phone', input.phone);
    setText('renter_email', input.email);
    setText('emergency_name', input.emergencyName);
    setText('emergency_relationship', input.emergencyRelationship);
    setText('emergency_phone', input.emergencyPhone);
    form.getCheckBox('renter_agree').check();
    form.getCheckBox('renter_safety_video').check();

    input.minors.forEach((minor, i) => {
        setText(`minor${i + 1}_name`, minor.name);
        setText(`minor${i + 1}_dob`, formatBirthDate(minor.dateOfBirth));
    });

    if (input.guardian) {
        setText('guardian_date', today);
        setText('guardian_name', input.guardian.name);
        setText('guardian_relationship', input.guardian.relationship);
        setText('guardian_phone', input.guardian.phone);
        form.getCheckBox('guardian_agree').check();
    }

    // Lock the filled form so it can't be edited after signing. Signature fields have no
    // appearance to flatten, so they stay as-is and the drawn signatures are stamped on top.
    form.updateFieldAppearances();
    form.getFields().forEach(field => field.enableReadOnly());

    const pages = pdfDoc.getPages();
    await drawSignature(pdfDoc, pages[RENTER_SIGNATURE_PAGE], RENTER_SIGNATURE_RECT, renterSignatureDataUrl);
    if (input.guardian) {
        await drawSignature(pdfDoc, pages[GUARDIAN_SIGNATURE_PAGE], GUARDIAN_SIGNATURE_RECT, input.guardian.signature);
    }

    return Buffer.from(await pdfDoc.save());
};

// Builds the PDF on demand from a stored waiver record. Nothing is saved to the database.
export const buildWaiverPdfFromRecord = (record: {
    form: WaiverFormInput;
    signature: string;
    dateSigned: Date;
}): Promise<Buffer> => buildSignedWaiverPdf(record.form, record.signature, record.dateSigned);


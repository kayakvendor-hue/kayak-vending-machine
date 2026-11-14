import React, { ReactNode, useState } from 'react';
import SignaturePad from './SignaturePad';

export interface RenterFields {
    fullName: string;
    address: string;
    phone: string;
    email: string;
    emergencyName: string;
    emergencyRelationship: string;
    emergencyPhone: string;
}

export interface MinorFields {
    name: string;
    dateOfBirth: string;
}

export interface GuardianFields {
    fullName: string;
    relationship: string;
    phone: string;
}

interface WaiverDocumentProps {
    // When provided, the renter's fill-in boxes appear after the renter acknowledgment.
    renter?: RenterFields;
    onRenterChange?: (field: keyof RenterFields, value: string) => void;
    // Renter's date of birth, shown in the renter block above the emergency contact.
    dateOfBirth?: string;
    onDateOfBirthChange?: (value: string) => void;
    maxDateOfBirth?: string;
    dateOfBirthError?: ReactNode;
    // Renter's signature, placed above the renter's date.
    renterSignature?: string | null;
    onRenterSignatureChange?: (dataUrl: string | null) => void;
    // When provided, checkboxes appear beside the renter acknowledgment sentences.
    agreementChecked?: boolean;
    onAgreementChange?: (checked: boolean) => void;
    safetyVideoChecked?: boolean;
    onSafetyVideoChange?: (checked: boolean) => void;
    // When provided with entries, the parent/guardian release and minors' boxes appear.
    minors?: MinorFields[];
    onMinorChange?: (index: number, field: keyof MinorFields, value: string) => void;
    // Parent/guardian signature, placed above the guardian's date.
    guardianSignature?: string | null;
    onGuardianSignatureChange?: (dataUrl: string | null) => void;
    // Parent/guardian details and their acknowledgment checkbox, shown in the release for minors.
    guardian?: GuardianFields;
    onGuardianChange?: (field: keyof GuardianFields, value: string) => void;
    guardianAgreed?: boolean;
    onGuardianAgreedChange?: (checked: boolean) => void;
}

// A small box that shows the signature. Clicking it opens a larger pad to draw in;
// submitting shrinks it back down to show the signature.
export const SignatureField: React.FC<{ value: string | null; onChange: (dataUrl: string | null) => void }> = ({ value, onChange }) => {
    const [editing, setEditing] = useState(false);

    if (editing) {
        return (
            <div style={{ width: 'min(480px, 100%)', margin: '6px 0' }}>
                <SignaturePad
                    height={150}
                    clearLabel="Erase"
                    onChange={(dataUrl) => {
                        onChange(dataUrl);
                        if (dataUrl) setEditing(false);
                    }}
                />
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setEditing(true)}
            style={{
                display: 'block',
                width: 'min(280px, 100%)',
                height: '34px',
                margin: '6px 0',
                padding: 0,
                border: '1px solid #888',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden'
            }}
        >
            {value
                ? <img src={value} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                : <span style={{ color: '#888', fontSize: '13px', padding: '0 8px', lineHeight: '34px' }}>Click to sign</span>}
        </button>
    );
};

const paragraphStyle: React.CSSProperties = { margin: '0 0 10px 0' };
const headingStyle: React.CSSProperties = { margin: '12px 0 4px 0', fontWeight: 'bold' };

// A fill-in box placed on the same line as its label, like the blanks on the PDF.
export const FillIn: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; max?: string }> = ({ label, value, onChange, type = 'text', placeholder, max }) => (
    <div style={{ margin: '6px 0' }}>
        <span style={{ marginRight: '6px' }}>{label}</span>
        <input
            type={type}
            value={value}
            placeholder={placeholder}
            max={max}
            onChange={(e) => onChange(e.target.value)}
            style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                width: 'min(280px, 100%)',
                boxSizing: 'border-box',
                padding: '4px 8px',
                border: '1px solid #888',
                borderRadius: '4px',
                font: 'inherit',
                backgroundColor: '#fff',
                color: '#000'
            }}
        />
    </div>
);

const Section: React.FC<{ heading: string; paragraphs: string[] }> = ({ heading, paragraphs }) => (
    <>
        <p style={headingStyle}>{heading}</p>
        {paragraphs.map((text, i) => <p key={i} style={paragraphStyle}>{text}</p>)}
    </>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
    <ul style={{ margin: '0 0 10px 0', paddingLeft: '22px' }}>
        {items.map((item, i) => <li key={i} style={{ marginBottom: '4px' }}>{item}</li>)}
    </ul>
);

// The waiver text, matching the signed PDF, with fill-in boxes placed where the PDF has its blanks.
const WaiverDocument: React.FC<WaiverDocumentProps> = ({ renter, onRenterChange, dateOfBirth, onDateOfBirthChange, maxDateOfBirth, dateOfBirthError, renterSignature, onRenterSignatureChange, agreementChecked, onAgreementChange, safetyVideoChecked, onSafetyVideoChange, minors, onMinorChange, guardianSignature, onGuardianSignatureChange, guardian, onGuardianChange, guardianAgreed, onGuardianAgreedChange }) => (
    <div style={{
        border: '1px solid #ccc',
        padding: '18px',
        marginBottom: '20px',
        borderRadius: '5px',
        backgroundColor: '#fff',
        color: '#000',
        fontSize: '14px',
        lineHeight: '1.5',
        textAlign: 'left',
        maxHeight: '60vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
    }}>
        <h3 style={{ textAlign: 'center', margin: '0 0 12px 0' }}>WAIVER, RELEASE OF LIABILITY AND RENTAL AGREEMENT</h3>
        <p style={paragraphStyle}><strong>PLEASE READ CAREFULLY BEFORE SIGNING. THIS IS A RELEASE OF LIABILITY AND A PROMISE NOT TO SUE. IT ALSO MAKES ME RESPONSIBLE FOR THE RENTED EQUIPMENT.</strong></p>
        <p style={paragraphStyle}>
            I, the undersigned, henceforth also referred to as the "Renter," am renting or using a kayak and related equipment from KayakVendor LLC, hereinafter referred to as the "Company," on Hoover Reservoir in Westerville, Ohio. I understand that the Company's rentals are self-service and unattended, and that no Company staff member will be present at the launch site or on the water during my rental. I understand that kayaking carries inherent risks, dangers, and hazards that can result in injury, illness, or death. I sign this Waiver, Release of Liability and Rental Agreement, hereinafter referred to as the "Agreement," for myself and my heirs, executors, representatives, family members, successors, and assigns, and I agree to the following:
        </p>

        <Section heading="Acceptance of potential risks." paragraphs={[
            "I understand that the risks of kayaking include, but are not limited to, capsizing, drowning, cold water shock and hypothermia, sudden changes in weather including storms and lightning, strong wind, waves, and changing water levels, collision with boats, docks, rocks, tree stumps or submerged objects, sunburn and heat exhaustion, contact with wildlife, fishing lines and hooks, fatigue, and delays in rescue or medical help. Because the rental is self-service and unattended, there is no lifeguard on site and no Company staff member to supervise me or help me if something goes wrong on the water. A child riding on an adult's lap may be thrown into the water or trapped if the kayak capsizes. Any of these may cause serious bodily injury, permanent disability, damage to property, or death. Some of these risks cannot be avoided even when the Company and I take reasonable care."
        ]} />
        <Section heading="Risk Assumptions." paragraphs={[
            "By signing this Agreement, I choose to take part in this activity of my own free will. I FULLY ACCEPT AND ASSUME ALL SUCH RISKS, KNOWN AND UNKNOWN, AND ALL RESPONSIBILITY FOR ANY INJURY, LOSS, DAMAGE, OR DEATH ARISING FROM MY USE OF THE KAYAK AND EQUIPMENT, INCLUDING THE RISKS OF RENTING WITHOUT STAFF SUPERVISION."
        ]} />
        <Section heading="Renter's responsibilities." paragraphs={[
            "I confirm that I am able to participate and that I have no medical condition that makes kayaking unsafe for me. Before my trip, I will watch the Company's safety video and confirm on the Company's website that I have done so. The Company provides life jackets, and I will wear a correctly fitted U.S. Coast Guard approved life jacket at all times while on the water, including when entering and exiting the kayak. I will not use alcohol or drugs before or during my rental, and I will follow all laws, all City of Columbus rules for Hoover Reservoir, and all instructions and safety rules given by the Company on its website, in its safety video, and on signs at the launch site. If weather or water conditions become unsafe, I will return to shore right away. Before going out, I will check the kayak, paddle, and life jacket and report any damage or defect to the Company through its website. If I use the equipment, I accept it as being in good working order. I am responsible for the safety and supervision of every minor in my care."
        ]} />

        <Section heading="Rental rules." paragraphs={["I agree to follow these rules for my rental:"]} />
        <Bullets items={[
            "I must be at least 18 years of age to rent a kayak.",
            "The Company reserves the right to cancel a trip due to weather.",
            "Waivers and safety video confirmations for all paddlers must be received prior to the trip, before anyone enters the water. Every adult who rides in a kayak must sign their own copy of this Agreement.",
            "Children under 8 years of age may ride on an adult's lap.",
            "Participants of minor age (8 years and older) must have a parent or guardian signature during registration. A parent or guardian must also complete the Parent or Guardian Release for Minors below for any child riding on an adult's lap.",
            "Minors must be accompanied by a parent or guardian at all times.",
            "All individuals in a kayak must wear a correctly fitted U.S. Coast Guard approved life jacket at all times, including when entering and exiting the kayak.",
            "I will avoid colliding with other watercraft, equipment, other boats, or the dock.",
            "The following are PROHIBITED: alcohol, glass in any form, smoking, swimming or diving, changing occupants, standing in the kayak, and removing or untying straps or buckles from a life jacket.",
            "No diving off boats or the shoreline.",
            "The Company is NOT responsible for personal items that I bring on the water.",
            "Should an emergency happen, call 911.",
        ]} />

        <Section heading="Return of equipment." paragraphs={[
            "When my trip is complete, I will lock up the kayak and put away the paddle and life jacket as the Company instructs. I will then upload a photograph of the returned and locked kayak on the Company's website. My rental is not complete until the kayak and all equipment are returned and the photograph is uploaded. I must return the kayak and equipment before my time slot is up. If I do not, my rental will be renewed for another hour and I will be charged for that hour at the Company's current hourly rate, and it will renew again for each further hour until the kayak and equipment are returned. IF THE KAYAK IS NOT RETURNED WITHIN 24 HOURS OF THE START OF MY RENTAL, I WILL BE CHARGED THE FULL REPLACEMENT COST OF THE KAYAK AND OF ANY EQUIPMENT NOT RETURNED."
        ]} />

        <Section heading="Damage, loss and theft." paragraphs={[
            "I am responsible for the kayak, paddle, life jacket, lock, and all other rented equipment from the moment I unlock the kayak until I have locked it up and uploaded the return photograph. Before going out, I will take a photograph of the kayak on the Company's website to record any damage that already exists. I CAN BE CHARGED FOR ANY DAMAGE FOUND AFTER MY RENTAL UNLESS A PHOTOGRAPH I TOOK BEFORE MY RENTAL SHOWS THAT DAMAGE. I agree to pay the cost to repair, or if repair is not possible, to replace, any kayak or equipment that is damaged, lost, or stolen during my rental, whether or not the damage, loss, or theft was my fault. This includes theft that happens because I did not lock the kayak properly at the end of my rental. I am not responsible for normal wear and tear. I authorize the Company to charge the payment method I used to book my rental for any extra hours, repair costs, and replacement costs I owe under this Agreement."
        ]} />
        <Section heading="Waiver and release." paragraphs={[
            "As the Renter, I hereby release, discharge, and covenant not to sue the Company, its owners, members, managers, employees, agents, and any other persons acting on its behalf, and the City of Columbus and its Recreation and Parks Department as the operator of Hoover Reservoir (collectively referred to as \"Releasees\") from any and all claims, demands, losses, and causes of action arising out of or related to my rental or use of the kayak, including claims for injury or death, WHETHER CAUSED BY THE NEGLIGENCE OF THE RELEASEES OR OTHERWISE, to the fullest extent permitted by law."
        ]} />
        <Section heading="Indemnification." paragraphs={[
            "I agree to indemnify and hold harmless the Releasees against any claims, damages, costs, and expenses, including attorney fees, brought by me or by any other person, including passengers, minors in my care, and family members, that arise from my use of the kayak, my own acts or omissions, or my failure to follow this Agreement."
        ]} />
        <Section heading="Medical treatment." paragraphs={[
            "If I or a minor in my care is injured or becomes ill, I authorize the Company to call for emergency medical care on our behalf, and I accept responsibility for all costs of that care and any transport."
        ]} />
        <Section heading="Electronic signature and records." paragraphs={[
            "I agree to sign this Agreement electronically and to receive it in electronic form. My electronic signature has the same legal effect as a handwritten signature. The Company may keep this Agreement as an electronic record, together with my name, contact details, and the date and time I signed it, and that record will be treated as the original. I may ask the Company for a copy of my signed Agreement at any time."
        ]} />
        <Section heading="Agreement." paragraphs={[]} />
        <Bullets items={[
            "The intent of this Agreement is to be as broad and inclusive as the law allows. If any provision of this Agreement is held invalid or unenforceable, only that portion shall be stricken, and the rest shall continue in full force and effect.",
            "This Agreement shall be governed by the laws of the State of Ohio.",
            "I confirm that I am at least 18 years old and that no one has made any promise or given me any inducement to sign this Agreement.",
        ]} />
        <p style={paragraphStyle}>
            <strong>I HAVE READ THIS AGREEMENT AND FULLY UNDERSTAND IT. I UNDERSTAND THAT BY SIGNING IT I AM GIVING UP MY RIGHT TO SUE THE RELEASEES FOR INJURY OR DEATH, INCLUDING INJURY OR DEATH CAUSED BY THEIR NEGLIGENCE, THAT I AM RESPONSIBLE FOR ANY DAMAGE, LOSS, OR THEFT OF THE RENTED EQUIPMENT, AND I SIGN IT VOLUNTARILY.</strong>
        </p>

        <div style={paragraphStyle}>
            {onAgreementChange ? (
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!agreementChecked} onChange={(e) => onAgreementChange(e.target.checked)} style={{ marginRight: '8px', marginTop: '4px', width: '18px', height: '18px', flexShrink: 0 }} />
                    <span>I have read this Agreement and I agree to its terms.</span>
                </label>
            ) : (
                <span>I have read this Agreement and I agree to its terms.</span>
            )}
            {onSafetyVideoChange ? (
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!safetyVideoChecked} onChange={(e) => onSafetyVideoChange(e.target.checked)} style={{ marginRight: '8px', marginTop: '4px', width: '18px', height: '18px', flexShrink: 0 }} />
                    <span>I have watched the Company's safety video.</span>
                </label>
            ) : (
                <span>I have watched the Company's safety video.</span>
            )}
        </div>

        {renter && onRenterChange && (
            <div style={{ marginTop: '8px' }}>
                <FillIn label="Full Name:" value={renter.fullName} onChange={(v) => onRenterChange('fullName', v)} />
                <FillIn label="Address:" value={renter.address} onChange={(v) => onRenterChange('address', v)} />
                <FillIn label="Phone:" value={renter.phone} onChange={(v) => onRenterChange('phone', v)} type="tel" />
                <FillIn label="Email:" value={renter.email} onChange={(v) => onRenterChange('email', v)} type="email" />
                {onDateOfBirthChange && (
                    <>
                        <FillIn label="Date of Birth:" value={dateOfBirth ?? ''} onChange={onDateOfBirthChange} type="date" max={maxDateOfBirth} />
                        {dateOfBirthError}
                    </>
                )}
                <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>Emergency Contact:</p>
                <div style={{ paddingLeft: '16px' }}>
                    <FillIn label="Name:" value={renter.emergencyName} onChange={(v) => onRenterChange('emergencyName', v)} />
                    <FillIn label="Relationship:" value={renter.emergencyRelationship} onChange={(v) => onRenterChange('emergencyRelationship', v)} />
                    <FillIn label="Phone:" value={renter.emergencyPhone} onChange={(v) => onRenterChange('emergencyPhone', v)} type="tel" />
                </div>
                <p style={{ margin: '10px 0 4px 0', fontWeight: 'bold' }}>Signature:</p>
                <SignatureField value={renterSignature ?? null} onChange={(v) => onRenterSignatureChange?.(v)} />
                <p style={{ margin: '10px 0 0 0' }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>
        )}

        {minors && minors.length > 0 && (
            <div style={{ borderTop: '2px solid #000', marginTop: '20px', paddingTop: '14px' }}>
                <h3 style={{ textAlign: 'center', margin: '0 0 12px 0' }}>PARENT OR GUARDIAN RELEASE FOR MINORS</h3>
                <p style={paragraphStyle}>
                    <strong>COMPLETE THIS SECTION FOR EVERY PERSON UNDER 18 YEARS OF AGE WHO WILL RIDE IN A KAYAK, INCLUDING A CHILD RIDING ON AN ADULT'S LAP.</strong>
                </p>
                <p style={paragraphStyle}>
                    I, the undersigned, henceforth also referred to as the "Parent or Guardian," am the parent or legal guardian of each minor named below, each hereinafter referred to as the "Minor." I have read the Waiver, Release of Liability and Rental Agreement above, and I agree to all of its terms on my own behalf and on behalf of each Minor. I also agree to the following:
                </p>
                <Section heading="Consent and supervision." paragraphs={[
                    "I give my permission for each Minor to ride in a kayak rented from the Company. I, or another parent or legal guardian of the Minor, will accompany the Minor at all times. Each Minor under 8 years of age will ride only on an adult's lap. Each Minor will wear a correctly fitted U.S. Coast Guard approved life jacket at all times, including when entering and exiting the kayak. Each Minor 8 years of age or older will watch the Company's safety video before the trip. I will make sure each Minor follows the Rental rules above."
                ]} />
                <Section heading="Risk assumption and release." paragraphs={[
                    "I understand that the risks of kayaking described above apply to each Minor. ON MY OWN BEHALF AND ON BEHALF OF EACH MINOR, I FULLY ACCEPT AND ASSUME ALL SUCH RISKS, AND I RELEASE, DISCHARGE, AND COVENANT NOT TO SUE THE RELEASEES FOR ANY INJURY, ILLNESS, OR DEATH OF THE MINOR, WHETHER CAUSED BY THE NEGLIGENCE OF THE RELEASEES OR OTHERWISE, to the fullest extent permitted by law. This release includes any claims I have as a parent or guardian, such as claims for the Minor's medical expenses."
                ]} />
                <Section heading="Indemnification." paragraphs={[
                    "I agree to indemnify and hold harmless the Releasees against any claims, damages, costs, and expenses, including attorney fees, brought by or on behalf of the Minor, or by any other person, that arise from the Minor's participation in the rental."
                ]} />
                <Section heading="Medical treatment." paragraphs={[
                    "If a Minor is injured or becomes ill, I authorize the Company to call for emergency medical care on the Minor's behalf, and I accept responsibility for all costs of that care and any transport."
                ]} />
                <p style={paragraphStyle}>
                    <strong>I HAVE READ THIS RELEASE AND THE AGREEMENT ABOVE AND FULLY UNDERSTAND THEM. I UNDERSTAND THAT BY SIGNING I AM GIVING UP MY OWN RIGHT, AND TO THE FULLEST EXTENT PERMITTED BY LAW THE MINOR'S RIGHT, TO SUE THE RELEASEES FOR INJURY OR DEATH, INCLUDING INJURY OR DEATH CAUSED BY THEIR NEGLIGENCE, AND I SIGN IT VOLUNTARILY.</strong>
                </p>
                <p style={{ fontWeight: 'bold', margin: '10px 0 4px 0' }}>Minors:</p>
                {minors.map((minor, i) => (
                    <div key={i} style={{ paddingLeft: '16px' }}>
                        <FillIn label={`Minor #${i + 1} Name:`} value={minor.name} onChange={(v) => onMinorChange?.(i, 'name', v)} placeholder="Full name" />
                        <FillIn label={`Minor #${i + 1} Date of Birth:`} value={minor.dateOfBirth} onChange={(v) => onMinorChange?.(i, 'dateOfBirth', v)} type="date" />
                    </div>
                ))}
                <p style={{ margin: '10px 0 4px 0', fontWeight: 'bold' }}>Parent or Guardian:</p>
                {onGuardianAgreedChange ? (
                    <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', margin: '0 0 8px 0' }}>
                        <input type="checkbox" checked={!!guardianAgreed} onChange={(e) => onGuardianAgreedChange(e.target.checked)} style={{ marginRight: '8px', marginTop: '4px', width: '18px', height: '18px', flexShrink: 0 }} />
                        <span>I have read this Release and the Agreement above and I agree to their terms.</span>
                    </label>
                ) : (
                    <span>I have read this Release and the Agreement above and I agree to their terms.</span>
                )}
                <p style={{ margin: '10px 0 4px 0', fontWeight: 'bold' }}>Signature:</p>
                <SignatureField value={guardianSignature ?? null} onChange={(v) => onGuardianSignatureChange?.(v)} />
                <p style={{ margin: '10px 0 0 0' }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                {guardian && (
                    <>
                        <FillIn label="Full Name:" value={guardian.fullName} onChange={(v) => onGuardianChange?.('fullName', v)} placeholder="Full name" />
                        <FillIn label="Relationship to Minor(s):" value={guardian.relationship} onChange={(v) => onGuardianChange?.('relationship', v)} />
                        <FillIn label="Phone:" value={guardian.phone} onChange={(v) => onGuardianChange?.('phone', v)} type="tel" />
                    </>
                )}
            </div>
        )}
    </div>
);

export default WaiverDocument;

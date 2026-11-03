import "./AgreementDraft.css";
import { agreementTerms } from "./agreementTerms";

export default function AgreementDraft() {
  return <section className="agreement-draft" aria-labelledby="agreement-draft-title">
    <header><div><span>TONI PHOTOGRAPHY · SNAPSMART</span><h3 id="agreement-draft-title">Photography service agreement</h3></div><strong>PREVIEW ONLY</strong></header>
    <p className="agreement-draft-intro">Proposed contract terms provided by Toni Photography. This preview is not a signed agreement.</p>
    <ol>{agreementTerms.map((term) => <li key={term}>{term}</li>)}</ol>
    <div className="agreement-draft-warning"><strong>Photo privacy</strong><p>Public use for portfolio and marketing is optional. Photos are private unless the client selects the public option.</p></div>
    <div className="agreement-draft-signature"><img src={`${import.meta.env.BASE_URL}ESIGN.png`} alt="Admin signature image, preview only" /><span>Admin signature image · preview only</span></div>
  </section>;
}

import Navbar from "./Navbar";
import "./LiveRecords.css";

export default function FeatureUnavailable({ title, publicPage = false }: { title: string; publicPage?: boolean }) {
  const content = <section className="live-records"><header><p>SNAPSMART</p><h2>{title}</h2></header><div className="live-records-empty"><strong>Not available yet</strong><p>This feature is not connected to live data yet. Sample data has been hidden.</p></div></section>;
  return publicPage ? <><Navbar /><main className="unavailable-public">{content}</main></> : content;
}

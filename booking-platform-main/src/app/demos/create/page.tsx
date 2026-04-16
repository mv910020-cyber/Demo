import DemoForm from "../../../components/demos/DemoForm";

export default function CreateDemoPage() {
  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Capture New Demo</h1>
        <p className="text-slate-500 mt-2">Log a new inbound request to push into the scheduling pipeline.</p>
      </div>
      <DemoForm />
    </div>
  );
}
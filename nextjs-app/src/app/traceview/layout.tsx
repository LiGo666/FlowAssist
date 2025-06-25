import React from 'react';

export const metadata = {
  title: 'Trace Viewer | FlowAssist',
  description: 'View telemetry traces for FlowAssist',
};

export default function TraceViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="traceview-layout">
      {children}
    </div>
  );
}

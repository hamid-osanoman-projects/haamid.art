import React from 'react';

// Disabled for Cloudflare Workers due to massive 5MB+ WASM size limits
// import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

interface InvoicePDFTemplateProps {
  invoiceData: any;
  clientData?: any;
  workData?: any;
}

export default function InvoicePDFTemplate({ invoiceData, clientData, workData }: InvoicePDFTemplateProps) {
  return (
    <div style={{ color: 'red' }}>
      <h1>PDF Generation is disabled on Cloudflare Workers edge environments</h1>
      <p>The @react-pdf/renderer library uses a Yoga WASM engine that exceeds Cloudflare's strict 1MB/3MB Worker size limits.</p>
    </div>
  );
}


import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 50,
  },
  brand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  brandSub: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9333ea', // Purple-600
    textAlign: 'right',
  },
  metaData: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
    marginTop: 4,
  },
  section: {
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billTo: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9333ea',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  clientText: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#333333',
  },
  table: {
    width: '100%',
    marginBottom: 40,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  tableCellDesc: {
    width: '60%',
    fontSize: 12,
    color: '#1a1a1a',
  },
  tableCellAmount: {
    width: '40%',
    fontSize: 12,
    color: '#1a1a1a',
    textAlign: 'right',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e5e5e5',
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    marginRight: 24,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9333ea',
    textAlign: 'right',
    width: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 9,
    color: '#999999',
    lineHeight: 1.5,
    textAlign: 'center',
  }
});

interface InvoicePDFTemplateProps {
  invoiceData: {
    invoiceNumber: string;
    date: string;
    dueDate: string;
    amount: number;
    currency: string;
    notes: string;
  };
  clientData?: {
    name: string;
    company?: string;
    email?: string;
  };
  workData?: {
    title: string;
  };
}

export default function InvoicePDFTemplate({ invoiceData, clientData, workData }: InvoicePDFTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>HAAAMID.ART</Text>
            <Text style={styles.brandSub}>Freelance OS & Design Studio</Text>
            <Text style={styles.brandSub}>Muscat, Oman</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.metaData}>#{invoiceData.invoiceNumber}</Text>
            <Text style={styles.metaData}>Date: {new Date(invoiceData.date).toLocaleDateString()}</Text>
            {invoiceData.dueDate && (
              <Text style={styles.metaData}>Due: {new Date(invoiceData.dueDate).toLocaleDateString()}</Text>
            )}
          </View>
        </View>

        {/* Bill To & Project Info */}
        <View style={styles.section}>
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            {clientData ? (
              <>
                <Text style={styles.clientText}>{clientData.name}</Text>
                {clientData.company && <Text style={styles.clientText}>{clientData.company}</Text>}
                {clientData.email && <Text style={styles.clientText}>{clientData.email}</Text>}
              </>
            ) : (
              <Text style={styles.clientText}>Client details pending...</Text>
            )}
          </View>
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>Project Detail</Text>
            <Text style={styles.clientText}>{workData?.title || 'General Services'}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '60%' }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { width: '40%', textAlign: 'right' }]}>Amount</Text>
          </View>
          
          {/* We only have one total amount per invoice in the current DB, so we map it as one line item */}
          <View style={styles.tableRow}>
            <Text style={styles.tableCellDesc}>
              {invoiceData.notes || 'Professional Services rendered for project.'}
            </Text>
            <Text style={styles.tableCellAmount}>
              {invoiceData.amount.toLocaleString()} {invoiceData.currency}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <Text style={styles.totalText}>Total Due:</Text>
          <Text style={styles.totalAmount}>
            {invoiceData.amount.toLocaleString()} {invoiceData.currency}
          </Text>
        </View>

        {/* Footer / Payment Terms */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business! Please process payment within the due timeframe.
          </Text>
          <Text style={styles.footerText}>
            Generated automatically via Haaamid OS Client Portal.
          </Text>
        </View>
        
      </Page>
    </Document>
  );
}

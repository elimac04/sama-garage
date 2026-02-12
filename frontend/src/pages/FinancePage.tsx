import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, FileText, Calendar, CheckCircle, Clock, AlertCircle, Eye, Receipt, Download, Printer, DollarSign, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, Input, Select } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useInterventionsStore, Intervention } from '@/stores/interventionsStore';
import { useFinanceStore } from '@/stores/financeStore';
import { useCashStore } from '@/stores/cashStore';
import { useToast } from '@/stores/toastStore';

const FinancePage = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wave' | 'orange_money'>('cash');
  const [submitting, setSubmitting] = useState(false);
  
  const { interventions, loading: interventionsLoading, fetchInterventions, updateIntervention } = useInterventionsStore();
  const { loading: invoicesLoading, fetchInvoices, createInvoice, recordPayment, getInvoiceByIntervention } = useFinanceStore();
  const { currentRegister, transactions, getTotalIncome, getTotalExpense, initCash, createTransactionApi } = useCashStore();
  const toast = useToast();

  // Fetch initial data
  useEffect(() => {
    fetchInterventions().catch(() => {});
    fetchInvoices().catch(() => {});
    initCash().catch(() => {});
  }, [fetchInterventions, fetchInvoices, initCash]);

  const loading = interventionsLoading || invoicesLoading;

  // Transactions de caisse récentes
  const recentCashTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const transactionDay = new Date(transactionDate);
        transactionDay.setHours(0, 0, 0, 0);
        return transactionDay.getTime() === today.getTime();
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Interventions filtrées par période
  const periodFilteredInterventions = useMemo(() => {
    if (filterPeriod === 'all') return interventions;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return interventions.filter(intervention => {
      const interventionDate = new Date(intervention.createdAt);
      
      if (filterPeriod === 'today') {
        const interventionDay = new Date(interventionDate);
        interventionDay.setHours(0, 0, 0, 0);
        return interventionDay.getTime() === today.getTime();
      }
      
      if (filterPeriod === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return interventionDate >= weekAgo;
      }
      
      if (filterPeriod === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return interventionDate >= monthAgo;
      }
      
      return true;
    });
  }, [interventions, filterPeriod]);

  // Calculer les statistiques financières (basées sur la période filtrée)
  const stats = useMemo(() => {
    const totalRevenue = periodFilteredInterventions.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = periodFilteredInterventions.reduce((sum, i) => sum + i.advancePayment, 0);
    const totalPending = periodFilteredInterventions.reduce((sum, i) => sum + i.remainingAmount, 0);
    const completedRevenue = periodFilteredInterventions
      .filter(i => i.status === 'completed')
      .reduce((sum, i) => sum + i.totalAmount, 0);

    // Ajouter les données de la caisse
    const cashIncome = getTotalIncome(filterPeriod === 'all' ? 'today' : filterPeriod);
    const cashExpense = getTotalExpense(filterPeriod === 'all' ? 'today' : filterPeriod);
    const cashBalance = cashIncome - cashExpense;

    return {
      totalRevenue: totalRevenue + cashIncome,
      totalPaid: totalPaid + cashIncome,
      totalPending: totalPending,
      completedRevenue: completedRevenue + cashIncome,
      totalInterventions: periodFilteredInterventions.length,
      paidCount: periodFilteredInterventions.filter(i => i.remainingAmount === 0).length,
      pendingCount: periodFilteredInterventions.filter(i => i.remainingAmount > 0).length,
      // Statistiques de caisse
      cashIncome,
      cashExpense,
      cashBalance,
      currentCashBalance: currentRegister?.currentBalance || 0,
    };
  }, [periodFilteredInterventions, getTotalIncome, getTotalExpense, filterPeriod, currentRegister]);

  // Filtrer les interventions par statut de paiement ET période
  const filteredInterventions = useMemo(() => {
    let filtered = periodFilteredInterventions;
    
    if (filterStatus === 'paid') {
      filtered = filtered.filter(i => i.remainingAmount === 0);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(i => i.remainingAmount > 0);
    }
    
    return filtered;
  }, [periodFilteredInterventions, filterStatus]);

  // Encaisser un paiement
  const handlePayment = async () => {
    if (!selectedIntervention || !paymentAmount) {
      toast.error('Veuillez renseigner tous les champs');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedIntervention.remainingAmount) {
      toast.error('Montant invalide');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Trouver ou créer la facture pour cette intervention
      let invoice = getInvoiceByIntervention(selectedIntervention.id);
      if (!invoice) {
        invoice = await createInvoice({
          intervention_id: selectedIntervention.id,
          total_amount: selectedIntervention.totalAmount,
          description: `${selectedIntervention.vehicle} - ${selectedIntervention.description}`,
        });
      }

      // 2. Enregistrer le paiement via l'API finance
      await recordPayment({
        invoice_id: invoice.id,
        payment_method: paymentMethod,
        amount_paid: amount,
      });

      // 3. Mettre à jour l'intervention (advance_payment + remaining)
      const newAdvancePayment = selectedIntervention.advancePayment + amount;
      const newRemainingAmount = selectedIntervention.totalAmount - newAdvancePayment;

      await updateIntervention(selectedIntervention.id, {
        advance_payment: newAdvancePayment,
        remaining_amount: newRemainingAmount,
      });

      // 4. Créer une transaction caisse si le registre est ouvert
      if (currentRegister) {
        try {
          await createTransactionApi({
            cash_register_id: currentRegister.id,
            type: 'income',
            category: 'Paiement intervention',
            amount,
            description: `${selectedIntervention.vehicle} - ${selectedIntervention.registration}`,
            payment_method: paymentMethod,
            reference_id: invoice.id,
            reference_type: 'invoice',
          });
        } catch {
          // Ne pas bloquer le paiement si la transaction caisse échoue
        }
      }

      toast.success(`Paiement de ${formatCurrency(amount)} enregistré !`);
      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedIntervention(null);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors du paiement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setPaymentAmount(intervention.remainingAmount.toString());
    setShowPaymentModal(true);
  };

  const handleViewDetails = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setShowDetailsModal(true);
  };

  // Fonction partagée pour construire le PDF de facture
  const buildInvoicePDF = async (intervention: Intervention) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - 2 * margin;
    let y = 0;

    // Chercher la facture backend si elle existe
    const existingInvoice = getInvoiceByIntervention(intervention.id);
    const invoiceNumber = existingInvoice?.invoice_number
      || `FAC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    const invoiceDate = existingInvoice?.issued_date
      ? formatDate(existingInvoice.issued_date)
      : formatDate(intervention.createdAt);

    // Calculs financiers
    const stockTotal = (intervention.stockItems || []).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const laborCost = Math.max(0, intervention.totalAmount - stockTotal);

    // ============================================================
    // EN-TETE : bandeau bleu foncé
    // ============================================================
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 48, 'F');

    // Accent doré sous le bandeau
    doc.setFillColor(234, 179, 8); // yellow-500
    doc.rect(0, 48, pageWidth, 2, 'F');

    // Nom du garage
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('SAMA GARAGE', margin, 22);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('Garage Automobile & Electromecanique', margin, 30);
    doc.text('Dakar, Senegal  |  Tel: +221 XX XXX XX XX', margin, 37);

    // Badge FACTURE en haut a droite
    doc.setFillColor(234, 179, 8);
    doc.roundedRect(pageWidth - margin - 52, 8, 52, 14, 2, 2, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', pageWidth - margin - 26, 17.5, { align: 'center' });

    // Numero + date
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceNumber, pageWidth - margin, 30, { align: 'right' });
    doc.text(`Date : ${invoiceDate}`, pageWidth - margin, 37, { align: 'right' });

    y = 60;

    // ============================================================
    // BLOCS CLIENT / VEHICULE cote a cote
    // ============================================================
    const halfW = (contentWidth - 8) / 2;

    // Bloc Client
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(margin, y, halfW, 44, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, y, halfW, 44, 3, 3, 'S');

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, halfW, 10, 3, 3, 'F');
    doc.rect(margin, y + 5, halfW, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT', margin + 4, y + 7);

    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(intervention.owner_name || 'N/A', margin + 4, y + 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Tel : ${intervention.owner_phone || 'N/A'}`, margin + 4, y + 28);

    // Bloc Vehicule
    const vehX = margin + halfW + 8;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(vehX, y, halfW, 44, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(vehX, y, halfW, 44, 3, 3, 'S');

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(vehX, y, halfW, 10, 3, 3, 'F');
    doc.rect(vehX, y + 5, halfW, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('VEHICULE', vehX + 4, y + 7);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(intervention.vehicle || 'N/A', vehX + 4, y + 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Immat : ${intervention.registration || 'N/A'}`, vehX + 4, y + 28);
    doc.text(`Mecanicien : ${intervention.mechanicName || 'N/A'}`, vehX + 4, y + 36);

    y += 54;

    // ============================================================
    // DESCRIPTION
    // ============================================================
    if (intervention.description) {
      doc.setFillColor(239, 246, 255); // blue-50
      doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
      doc.setTextColor(30, 64, 175); // blue-800
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPTION :', margin + 4, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const descLines = doc.splitTextToSize(intervention.description, contentWidth - 8);
      doc.text(descLines[0] || '', margin + 4, y + 12);
      y += 20;
    }

    // ============================================================
    // TABLEAU DES PRESTATIONS
    // ============================================================
    const tableX = margin;
    const colWidths = [contentWidth * 0.45, contentWidth * 0.12, contentWidth * 0.22, contentWidth * 0.21];
    const colPositions = [tableX];
    for (let i = 1; i < colWidths.length; i++) {
      colPositions.push(colPositions[i - 1] + colWidths[i - 1]);
    }

    // En-tete du tableau
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(tableX, y, contentWidth, 10, 2, 2, 'F');
    doc.rect(tableX, y + 5, contentWidth, 5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DESIGNATION', colPositions[0] + 4, y + 7);
    doc.text('QTE', colPositions[1] + 4, y + 7);
    doc.text('PRIX UNIT.', colPositions[2] + 4, y + 7);
    doc.text('MONTANT', colPositions[3] + 4, y + 7);

    y += 12;

    // Ligne : Main d'oeuvre (toujours)
    let rowBg = true;
    const drawRow = (label: string, qty: string, pu: string, total: string, bold = false) => {
      if (rowBg) {
        doc.setFillColor(248, 250, 252);
        doc.rect(tableX, y - 4.5, contentWidth, 8, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(label, colPositions[0] + 4, y);
      doc.text(qty, colPositions[1] + 4, y);
      doc.text(pu, colPositions[2] + 4, y);
      doc.text(total, colPositions[3] + colWidths[3] - 2, y, { align: 'right' });
      // Ligne separatrice fine
      doc.setDrawColor(226, 232, 240);
      doc.line(tableX, y + 3, tableX + contentWidth, y + 3);
      y += 8;
      rowBg = !rowBg;
    };

    drawRow('Main d\'oeuvre', '1', formatCurrency(laborCost), formatCurrency(laborCost));

    // Lignes articles stock
    if (intervention.stockItems && intervention.stockItems.length > 0) {
      intervention.stockItems.forEach((item) => {
        drawRow(
          item.name,
          String(item.quantity),
          formatCurrency(item.unitPrice),
          formatCurrency(item.quantity * item.unitPrice)
        );
      });
    }

    y += 2;

    // ============================================================
    // RECAPITULATIF FINANCIER (bloc a droite)
    // ============================================================
    const summaryW = 82;
    const summaryX = pageWidth - margin - summaryW;

    // Sous-total main d'oeuvre
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Sous-total main d\'oeuvre :', summaryX, y);
    doc.text(formatCurrency(laborCost), pageWidth - margin, y, { align: 'right' });
    y += 6;

    // Sous-total pieces
    doc.text('Sous-total pieces :', summaryX, y);
    doc.text(formatCurrency(stockTotal), pageWidth - margin, y, { align: 'right' });
    y += 8;

    // Ligne separatrice
    doc.setDrawColor(203, 213, 225);
    doc.line(summaryX, y - 2, pageWidth - margin, y - 2);

    // Total TTC (fond fonce)
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(summaryX - 2, y, summaryW + 2, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL TTC', summaryX + 2, y + 8);
    doc.text(formatCurrency(intervention.totalAmount), pageWidth - margin - 2, y + 8, { align: 'right' });
    y += 18;

    // Acompte verse (vert)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74); // green-600
    doc.text('Acompte verse :', summaryX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`- ${formatCurrency(intervention.advancePayment)}`, pageWidth - margin, y, { align: 'right' });
    y += 8;

    // Reste a payer (fond orange)
    if (intervention.remainingAmount > 0) {
      doc.setFillColor(255, 237, 213); // orange-100
      doc.roundedRect(summaryX - 2, y - 3, summaryW + 2, 12, 2, 2, 'F');
      doc.setDrawColor(251, 146, 60); // orange-400
      doc.roundedRect(summaryX - 2, y - 3, summaryW + 2, 12, 2, 2, 'S');
    } else {
      doc.setFillColor(220, 252, 231); // green-100
      doc.roundedRect(summaryX - 2, y - 3, summaryW + 2, 12, 2, 2, 'F');
      doc.setDrawColor(74, 222, 128); // green-400
      doc.roundedRect(summaryX - 2, y - 3, summaryW + 2, 12, 2, 2, 'S');
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(intervention.remainingAmount > 0 ? 194 : 22, intervention.remainingAmount > 0 ? 65 : 163, intervention.remainingAmount > 0 ? 12 : 74);
    doc.text(intervention.remainingAmount > 0 ? 'RESTE A PAYER' : 'SOLDE', summaryX + 2, y + 5);
    doc.text(formatCurrency(intervention.remainingAmount), pageWidth - margin - 2, y + 5, { align: 'right' });

    y += 18;

    // ============================================================
    // MODE DE PAIEMENT
    // ============================================================
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('MODES DE PAIEMENT ACCEPTES :', margin + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Especes  |  Wave  |  Orange Money', margin + 4, y + 11);

    // ============================================================
    // PIED DE PAGE
    // ============================================================
    // Ligne accent doree
    doc.setFillColor(234, 179, 8);
    doc.rect(0, pageHeight - 28, pageWidth, 1.5, 'F');

    // Fond du footer
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 26.5, pageWidth, 26.5, 'F');

    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Merci pour votre confiance !', pageWidth / 2, pageHeight - 18, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('SAMA GARAGE - Garage Automobile & Electromecanique - Dakar, Senegal', pageWidth / 2, pageHeight - 11, { align: 'center' });
    doc.text(`Facture generee electroniquement le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

    return { doc, invoiceNumber };
  };

  // Telecharger la facture PDF
  const generateInvoicePDF = async (intervention: Intervention) => {
    const { doc, invoiceNumber } = await buildInvoicePDF(intervention);
    const fileName = `Facture_${invoiceNumber}_${intervention.vehicle.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
    toast.success('Facture telecharger avec succes !');
  };

  // Imprimer la facture
  const printInvoice = async (intervention: Intervention) => {
    const { doc } = await buildInvoicePDF(intervention);
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(url);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    toast.success('Ouverture de la facture pour impression...');
  };


  if (loading && interventions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
        <p className="text-gray-600 mt-1">Gestion des paiements et revenus</p>
      </div>

      {/* Stats financières */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Chiffre d'affaires total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalInterventions} intervention{stats.totalInterventions > 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-primary-500 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Montant encaissé</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.paidCount} payé{stats.paidCount > 1 ? 's' : ''} en totalité
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Montant restant</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalPending)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pendingCount} en attente
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Solde caisse</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.currentCashBalance)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentRegister ? 'Caisse ouverte' : 'Caisse fermée'}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Balance caisse</p>
                <p className={`text-2xl font-bold ${stats.cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.cashBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Entrées - Sorties
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stats.cashBalance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Filtre par période */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Période:</span>
                {[
                  { value: 'all', label: 'Tout', icon: '📊' },
                  { value: 'today', label: 'Aujourd\'hui', icon: '📅' },
                  { value: 'week', label: 'Cette semaine', icon: '📆' },
                  { value: 'month', label: 'Ce mois', icon: '🗓️' },
                ].map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={filterPeriod === filter.value ? 'primary' : 'secondary'}
                    onClick={() => setFilterPeriod(filter.value as any)}
                  >
                    {filter.icon} {filter.label}
                  </Button>
                ))}
              </div>
              {filterPeriod !== 'all' && (
                <p className="text-xs text-gray-500">
                  {periodFilteredInterventions.length} intervention{periodFilteredInterventions.length > 1 ? 's' : ''} sur cette période
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filtre par statut */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Statut de paiement:</span>
              {[
                { value: 'all', label: 'Toutes' },
                { value: 'paid', label: 'Payées' },
                { value: 'pending', label: 'En attente' },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  size="sm"
                  variant={filterStatus === filter.value ? 'primary' : 'secondary'}
                  onClick={() => setFilterStatus(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des interventions / factures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Interventions et Paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInterventions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune intervention trouvée</p>
          ) : (
            <div className="space-y-3">
              {filteredInterventions.map((intervention) => {
                const isPaid = intervention.remainingAmount === 0;
                const isPartiallyPaid = intervention.advancePayment > 0 && intervention.remainingAmount > 0;
                
                return (
                  <div 
                    key={intervention.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Icône et informations */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isPaid ? 'bg-green-100' :
                          isPartiallyPaid ? 'bg-blue-100' : 'bg-orange-100'
                        }`}>
                          <FileText className={`h-6 w-6 ${
                            isPaid ? 'text-green-600' :
                            isPartiallyPaid ? 'text-blue-600' : 'text-orange-600'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {intervention.vehicle}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {intervention.registration} • {intervention.description}
                              </p>
                              {(() => {
                                const inv = getInvoiceByIntervention(intervention.id);
                                return inv ? (
                                  <p className="text-xs text-primary-600 font-mono mt-0.5">{inv.invoice_number}</p>
                                ) : null;
                              })()}
                              <p className="text-xs text-gray-500 mt-1">
                                Mécanicien: {intervention.mechanicName}
                              </p>
                            </div>
                            <Badge 
                              variant={isPaid ? 'success' : isPartiallyPaid ? 'info' : 'warning'}
                            >
                              {isPaid ? 'Payé' : isPartiallyPaid ? 'Acompte versé' : 'Non payé'}
                            </Badge>
                          </div>

                          {/* Détails paiement */}
                          <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(intervention.createdAt)}</span>
                            </div>
                            <div className="text-gray-600">
                              Total: <span className="font-bold">{formatCurrency(intervention.totalAmount)}</span>
                            </div>
                            {intervention.advancePayment > 0 && (
                              <div className="text-green-600">
                                Acompte: <span className="font-bold">{formatCurrency(intervention.advancePayment)}</span>
                              </div>
                            )}
                            {intervention.remainingAmount > 0 && (
                              <div className="text-orange-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                Reste: <span className="font-bold">{formatCurrency(intervention.remainingAmount)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewDetails(intervention)}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                        
                        <Button 
                          size="sm"
                          variant="secondary"
                          onClick={() => generateInvoicePDF(intervention)}
                          title="Télécharger la facture PDF"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Facture
                        </Button>
                        
                        <Button 
                          size="sm"
                          variant="secondary"
                          onClick={() => printInvoice(intervention)}
                          title="Imprimer la facture"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        
                        {intervention.remainingAmount > 0 && (
                          <Button 
                            size="sm"
                            onClick={() => handleOpenPaymentModal(intervention)}
                            className="bg-green-600 hover:bg-green-700"
                            title="Encaisser un paiement"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Encaisser
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions de caisse récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Transactions de caisse récentes
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.open('/cash', '_self')}>
              Voir tout →
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentCashTransactions.length === 0 ? (
            <div className="text-center py-6">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune transaction de caisse aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCashTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de paiement */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedIntervention(null);
          setPaymentAmount('');
        }}
        title="Encaisser un paiement"
        size="md"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedIntervention(null);
                setPaymentAmount('');
              }}
            >
              Annuler
            </Button>
            <Button onClick={handlePayment} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              {submitting ? 'Traitement...' : 'Valider le paiement'}
            </Button>
          </>
        }
      >
        {selectedIntervention && (
          <div className="space-y-4">
            {/* Info intervention */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">{selectedIntervention.vehicle}</h4>
              <p className="text-sm text-gray-600">{selectedIntervention.registration}</p>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <p className="text-gray-500">Montant total</p>
                  <p className="font-bold text-gray-900">{formatCurrency(selectedIntervention.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Déjà payé</p>
                  <p className="font-bold text-green-600">{formatCurrency(selectedIntervention.advancePayment)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Montant restant</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(selectedIntervention.remainingAmount)}</p>
                </div>
              </div>
            </div>

            {/* Formulaire de paiement */}
            <Input
              label="Montant à encaisser (FCFA)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Montant"
              required
              min="1"
              max={selectedIntervention.remainingAmount}
            />

            <Select
              label="Mode de paiement"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              options={[
                { value: 'cash', label: '💵 Espèces' },
                { value: 'wave', label: '📱 Wave' },
                { value: 'orange_money', label: '🍊 Orange Money' },
              ]}
            />

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Info:</strong> Le paiement sera automatiquement enregistré sur cette intervention.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de détails */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedIntervention(null);
        }}
        title="Détails de l'intervention"
        size="lg"
      >
        {selectedIntervention && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Véhicule</p>
                <p className="font-semibold text-gray-900">{selectedIntervention.vehicle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Immatriculation</p>
                <p className="font-semibold text-gray-900">{selectedIntervention.registration}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Propriétaire</p>
                <p className="font-semibold text-gray-900">{selectedIntervention.owner_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-semibold text-gray-900">{selectedIntervention.owner_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mécanicien</p>
                <p className="font-semibold text-gray-900">{selectedIntervention.mechanicName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">{formatDate(selectedIntervention.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900">{selectedIntervention.description}</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Détails financiers</h4>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant total:</span>
                  <span className="font-bold">{formatCurrency(selectedIntervention.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Acompte versé:</span>
                  <span className="font-bold">{formatCurrency(selectedIntervention.advancePayment)}</span>
                </div>
                <div className="flex justify-between text-orange-600 text-lg font-bold border-t pt-2">
                  <span>Montant restant:</span>
                  <span>{formatCurrency(selectedIntervention.remainingAmount)}</span>
                </div>
              </div>
            </div>

            {selectedIntervention.stockItems && selectedIntervention.stockItems.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Articles utilisés</h4>
                <div className="space-y-2">
                  {selectedIntervention.stockItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>{item.name} x {item.quantity}</span>
                      <span className="font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FinancePage;

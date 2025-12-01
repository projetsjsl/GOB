/**
 * PDF Export Utility
 * Generate professional analysis reports
 * Uses jsPDF library
 */

window.PDFExporter = {
    /**
     * Generate comprehensive stock analysis PDF
     */
    async generateAnalysisReport(symbol, analysisData) {
        // Load jsPDF if not already loaded
        if (!window.jspdf) {
            await this.loadJsPDF();
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let yPos = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);

        // Header with branding
        doc.setFillColor(30, 41, 59); // Dark blue
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('ANALYSE FINANCIÈRE', margin, 25);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`${symbol} - ${new Date().toLocaleDateString('fr-FR')}`, margin, 33);

        // Add logo/watermark
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(10);
        doc.text('Propulsé par JSL AI™', pageWidth - margin - 40, 33);

        yPos = 50;

        // Section 1: Executive Summary
        this.addSection(doc, 'Résumé Exécutif', yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        const summary = [
            `Prix Actuel: $${analysisData.currentPrice.toFixed(2)}`,
            `Juste Valeur (DCF): $${analysisData.fairValue.toFixed(2)}`,
            `Potentiel: ${analysisData.upside >= 0 ? '+' : ''}${analysisData.upside.toFixed(1)}%`,
            `Recommandation: ${analysisData.recommendation}`
        ];

        summary.forEach(line => {
            doc.text(line, margin, yPos);
            yPos += 6;
        });

        yPos += 10;

        // Section 2: Valuation Metrics
        this.addSection(doc, 'Métriques de Valorisation', yPos);
        yPos += 10;

        const valuationTable = [
            ['Méthode', 'Valeur', 'Écart vs Prix'],
            ['DCF', `$${analysisData.dcfValue.toFixed(2)}`, `${((analysisData.dcfValue - analysisData.currentPrice) / analysisData.currentPrice * 100).toFixed(1)}%`],
            ['P/E Multiple', `$${analysisData.peValue.toFixed(2)}`, `${((analysisData.peValue - analysisData.currentPrice) / analysisData.currentPrice * 100).toFixed(1)}%`],
            ['P/B Multiple', `$${analysisData.pbValue.toFixed(2)}`, `${((analysisData.pbValue - analysisData.currentPrice) / analysisData.currentPrice * 100).toFixed(1)}%`]
        ];

        this.addTable(doc, valuationTable, margin, yPos, contentWidth);
        yPos += 40;

        // Check if new page needed
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 20;
        }

        // Section 3: Financial Metrics
        this.addSection(doc, 'Indicateurs Financiers Clés', yPos);
        yPos += 10;

        const metricsTable = [
            ['Métrique', 'Valeur', 'Santé'],
            ['ROE', `${analysisData.metrics.roe.toFixed(2)}%`, this.getHealthIndicator(analysisData.metrics.roe, 15)],
            ['ROA', `${analysisData.metrics.roa.toFixed(2)}%`, this.getHealthIndicator(analysisData.metrics.roa, 8)],
            ['Ratio Courant', analysisData.metrics.currentRatio.toFixed(2), this.getHealthIndicator(analysisData.metrics.currentRatio, 1.5)],
            ['Dette/Capitaux', analysisData.metrics.debtToEquity.toFixed(2), this.getHealthIndicator(2 - analysisData.metrics.debtToEquity, 0.5)]
        ];

        this.addTable(doc, metricsTable, margin, yPos, contentWidth);
        yPos += 50;

        // Section 4: AI Insights
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        }

        this.addSection(doc, 'Insights IA', yPos);
        yPos += 10;

        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);

        if (analysisData.aiInsights) {
            // Strengths
            doc.setFont(undefined, 'bold');
            doc.text('Forces:', margin, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');

            analysisData.aiInsights.strengths.forEach(strength => {
                const lines = doc.splitTextToSize(`• ${strength}`, contentWidth - 5);
                lines.forEach(line => {
                    doc.text(line, margin + 5, yPos);
                    yPos += 5;
                });
            });

            yPos += 5;

            // Weaknesses
            doc.setFont(undefined, 'bold');
            doc.text('Faiblesses:', margin, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');

            analysisData.aiInsights.weaknesses.forEach(weakness => {
                const lines = doc.splitTextToSize(`• ${weakness}`, contentWidth - 5);
                lines.forEach(line => {
                    doc.text(line, margin + 5, yPos);
                    yPos += 5;
                });
            });
        }

        // Footer on all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Page ${i} sur ${pageCount} | Généré le ${new Date().toLocaleString('fr-FR')}`,
                margin,
                pageHeight - 10
            );
            doc.text(
                'Ce document est fourni à titre informatif uniquement.',
                pageWidth - margin - 80,
                pageHeight - 10
            );
        }

        // Save the PDF
        doc.save(`${symbol}_Analyse_${new Date().toISOString().split('T')[0]}.pdf`);
    },

    addSection(doc, title, yPos) {
        doc.setFillColor(59, 130, 246); // Blue
        doc.rect(20, yPos - 5, 170, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(title, 22, yPos);
        doc.setTextColor(60, 60, 60);
        doc.setFont(undefined, 'normal');
    },

    addTable(doc, data, x, y, width) {
        const rowHeight = 8;
        const colWidth = width / data[0].length;

        // Header
        doc.setFillColor(240, 240, 240);
        doc.rect(x, y, width, rowHeight, 'F');
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);

        data[0].forEach((header, i) => {
            doc.text(header, x + (i * colWidth) + 2, y + 5);
        });

        // Rows
        doc.setFont(undefined, 'normal');
        data.slice(1).forEach((row, rowIndex) => {
            const rowY = y + ((rowIndex + 1) * rowHeight);

            if (rowIndex % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(x, rowY, width, rowHeight, 'F');
            }

            row.forEach((cell, colIndex) => {
                doc.text(String(cell), x + (colIndex * colWidth) + 2, rowY + 5);
            });
        });
    },

    getHealthIndicator(value, threshold) {
        if (value >= threshold) return '✓ Bon';
        if (value >= threshold * 0.7) return '~ Moyen';
        return '✗ Faible';
    },

    async loadJsPDF() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
};

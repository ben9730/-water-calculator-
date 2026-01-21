/**
 * Water Bill Calculator for Israel 2026
 * Calculates water bills based on official Israeli Water Authority tariffs
 */

// ============================================
// CONSTANTS AND TARIFF DATA
// ============================================

const TARIFFS = {
    2026: {
        reduced: 8.508,  // NIS per cubic meter (includes VAT)
        full: 15.623,    // NIS per cubic meter (includes VAT)
        year: 2026
    },
    2025: {
        reduced: 8.314,  // NIS per cubic meter (includes VAT - 7.046 base + 18% VAT)
        full: 15.260,    // NIS per cubic meter (includes VAT - 12.932 base + 18% VAT)
        year: 2025
    }
};

const ALLOCATION_PER_PERSON = 3.5; // cubic meters per person per month
const DISABILITY_BONUS = 3.5;      // additional cubic meters for 70%+ disability
const MINIMUM_CHARGE = 3;          // minimum cubic meters for bi-monthly period

let currentChart = null; // Store chart instance for updates

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get tariffs for a specific year
 */
function getTariffs(year) {
    return TARIFFS[year] || TARIFFS[2026];
}

/**
 * Calculate basic allocation based on persons, disability, and period
 */
function calculateAllocation(persons, hasDisability, period) {
    let allocation = persons * ALLOCATION_PER_PERSON * period;

    if (hasDisability) {
        allocation += DISABILITY_BONUS * period;
    }

    return allocation;
}

/**
 * Format number to 2 decimal places
 */
function formatNumber(num) {
    return Number(num).toFixed(2);
}

/**
 * Toggle instructions box visibility
 */
function toggleInstructions() {
    const instructionsBox = document.getElementById('instructionsBox');
    instructionsBox.classList.toggle('hidden');
}

/**
 * Show results section with animation
 */
function showResults() {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.remove('hidden');

    // Smooth scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

/**
 * Hide results section
 */
function hideResults() {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.add('hidden');
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Main water bill calculation function
 */
function calculateWaterBill(consumption, persons, period, hasDisability, year) {
    const tariffs = getTariffs(year);
    const allocation = calculateAllocation(persons, hasDisability, period);

    // Calculate consumption in each tier
    let reducedConsumption = Math.min(consumption, allocation);
    let fullConsumption = Math.max(0, consumption - allocation);

    // Apply minimum charge for bi-monthly period
    let minChargeApplied = false;
    if (period === 2 && consumption < MINIMUM_CHARGE) {
        consumption = MINIMUM_CHARGE;
        reducedConsumption = Math.min(MINIMUM_CHARGE, allocation);
        fullConsumption = Math.max(0, MINIMUM_CHARGE - allocation);
        minChargeApplied = true;
    }

    // Calculate prices
    const reducedPrice = reducedConsumption * tariffs.reduced;
    const fullPrice = fullConsumption * tariffs.full;
    const totalPrice = reducedPrice + fullPrice;

    return {
        allocation,
        reducedConsumption,
        fullConsumption,
        reducedPrice,
        fullPrice,
        totalPrice,
        tariffs,
        minChargeApplied,
        actualConsumption: consumption
    };
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handle form submission
 */
function calculateWater(event) {
    event.preventDefault();

    // Get form values
    const consumption = parseFloat(document.getElementById('consumption').value);
    const persons = parseInt(document.getElementById('persons').value);
    const period = parseInt(document.getElementById('period').value);
    const hasDisability = document.getElementById('disability').checked;
    const year = parseInt(document.getElementById('year').value);

    // Validate input
    if (isNaN(consumption) || consumption < 0) {
        alert('אנא הכנס כמות צריכה תקינה');
        return;
    }

    // Calculate current year
    const currentResult = calculateWaterBill(consumption, persons, period, hasDisability, 2026);

    // Display results
    displayResults(currentResult, persons, period);

    // Check if historical comparison is needed
    if (year !== 2026) {
        const historicalResult = calculateWaterBill(consumption, persons, period, hasDisability, year);
        displayComparison(currentResult, historicalResult, year);
    } else {
        hideComparison();
    }

    // Create chart
    createChart(currentResult);

    // Show results section
    showResults();

    // Save to localStorage
    saveToLocalStorage({
        consumption,
        persons,
        period,
        hasDisability,
        year
    });
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

/**
 * Display calculation results
 */
function displayResults(result, persons, period) {
    // Update allocated values
    document.getElementById('allocatedCubic').textContent = formatNumber(result.reducedConsumption);
    document.getElementById('reducedPrice').textContent = formatNumber(result.reducedPrice);
    document.getElementById('reducedRate').textContent = formatNumber(result.tariffs.reduced);

    // Update excess values
    document.getElementById('excessCubic').textContent = formatNumber(result.fullConsumption);
    document.getElementById('fullPrice').textContent = formatNumber(result.fullPrice);
    document.getElementById('fullRate').textContent = formatNumber(result.tariffs.full);

    // Update total
    document.getElementById('totalPrice').textContent = formatNumber(result.totalPrice);

    // Show minimum charge note if applicable
    const minChargeNote = document.getElementById('minChargeNote');
    if (result.minChargeApplied) {
        minChargeNote.textContent = '* הוחל חיוב מינימלי של 3 מ"ק לתקופה דו-חודשית';
        minChargeNote.style.display = 'block';
    } else {
        minChargeNote.style.display = 'none';
    }
}

/**
 * Display historical comparison
 */
function displayComparison(currentResult, historicalResult, historicalYear) {
    const comparisonSection = document.getElementById('comparisonSection');
    comparisonSection.classList.remove('hidden');

    // Display prices
    document.getElementById('currentYearPrice').textContent = formatNumber(currentResult.totalPrice) + ' ₪';
    document.getElementById('previousYearPrice').textContent = formatNumber(historicalResult.totalPrice) + ' ₪';

    // Calculate difference
    const difference = currentResult.totalPrice - historicalResult.totalPrice;
    const percentDiff = ((difference / historicalResult.totalPrice) * 100).toFixed(1);

    document.getElementById('diffAmount').textContent = formatNumber(Math.abs(difference));
    document.getElementById('diffPercent').textContent = `(${percentDiff}%)`;

    // Color code the difference
    const diffElement = document.getElementById('priceDifference');
    if (difference > 0) {
        diffElement.style.color = '#DC3545'; // Red for increase
        document.getElementById('diffAmount').textContent = '+' + formatNumber(difference);
    } else if (difference < 0) {
        diffElement.style.color = '#28A745'; // Green for decrease
        document.getElementById('diffAmount').textContent = formatNumber(difference);
    } else {
        diffElement.style.color = '#6C757D'; // Gray for no change
    }
}

/**
 * Hide comparison section
 */
function hideComparison() {
    const comparisonSection = document.getElementById('comparisonSection');
    comparisonSection.classList.add('hidden');
}

/**
 * Create or update chart visualization
 */
function createChart(result) {
    const ctx = document.getElementById('waterChart').getContext('2d');

    // Destroy previous chart if exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Create new chart
    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [
                `תעריף מופחת (${formatNumber(result.reducedConsumption)} מ"ק)`,
                `תעריף מלא (${formatNumber(result.fullConsumption)} מ"ק)`
            ],
            datasets: [{
                data: [result.reducedPrice, result.fullPrice],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',   // Green for reduced
                    'rgba(255, 165, 0, 0.8)'     // Orange for full
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(255, 165, 0, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Heebo',
                            size: 14
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'פיצול עלות לפי תעריף',
                    font: {
                        family: 'Heebo',
                        size: 18,
                        weight: 'bold'
                    },
                    padding: 20
                },
                tooltip: {
                    rtl: true,
                    backgroundColor: 'rgba(44, 62, 80, 0.9)',
                    titleFont: {
                        family: 'Heebo',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Heebo',
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatNumber(context.parsed);
                            const percent = ((context.parsed / result.totalPrice) * 100).toFixed(1);
                            return `${label}: ${value} ₪ (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// EXPORT AND UTILITY FUNCTIONS
// ============================================

/**
 * Export results to PDF
 */
function exportToPDF() {
    // Get jsPDF from global
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Get current values
    const consumption = parseFloat(document.getElementById('consumption').value);
    const persons = parseInt(document.getElementById('persons').value);
    const period = parseInt(document.getElementById('period').value);
    const hasDisability = document.getElementById('disability').checked;
    const year = parseInt(document.getElementById('year').value);

    const result = calculateWaterBill(consumption, persons, period, hasDisability, 2026);

    // Hebrew font support - using default with English/Numbers
    const lineHeight = 10;
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Water Bill Calculation Report - Israel 2026', 105, yPos, { align: 'center' });
    yPos += lineHeight * 2;

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString('he-IL')}`, 105, yPos, { align: 'center' });
    yPos += lineHeight * 2;

    // Input Parameters
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Input Parameters:', 20, yPos);
    yPos += lineHeight;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Consumption: ${consumption} cubic meters`, 30, yPos);
    yPos += lineHeight * 0.8;
    doc.text(`Household size: ${persons} persons`, 30, yPos);
    yPos += lineHeight * 0.8;
    doc.text(`Billing period: ${period === 1 ? 'Monthly' : 'Bi-monthly'}`, 30, yPos);
    yPos += lineHeight * 0.8;
    doc.text(`Disability benefit: ${hasDisability ? 'Yes' : 'No'}`, 30, yPos);
    yPos += lineHeight * 0.8;
    doc.text(`Basic allocation: ${formatNumber(result.allocation)} cubic meters`, 30, yPos);
    yPos += lineHeight * 2;

    // Calculation Results
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculation Results:', 20, yPos);
    yPos += lineHeight;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reduced rate (${formatNumber(result.tariffs.reduced)} NIS/m3):`, 30, yPos);
    yPos += lineHeight * 0.8;
    doc.text(`  ${formatNumber(result.reducedConsumption)} m3 x ${formatNumber(result.tariffs.reduced)} = ${formatNumber(result.reducedPrice)} NIS`, 35, yPos);
    yPos += lineHeight;

    doc.text(`Full rate (${formatNumber(result.tariffs.full)} NIS/m3):`, 30, yPos);
    yPos += lineHeight * 0.8;
    doc.text(`  ${formatNumber(result.fullConsumption)} m3 x ${formatNumber(result.tariffs.full)} = ${formatNumber(result.fullPrice)} NIS`, 35, yPos);
    yPos += lineHeight * 2;

    // Total
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${formatNumber(result.totalPrice)} NIS`, 105, yPos, { align: 'center' });
    yPos += lineHeight * 2;

    // Notes
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    if (result.minChargeApplied) {
        doc.text('* Minimum charge of 3 cubic meters applied for bi-monthly period', 20, yPos);
        yPos += lineHeight;
    }

    yPos += lineHeight;
    doc.text('Tariffs are based on Israel Water Authority rates for 2026', 20, yPos);
    yPos += lineHeight * 0.8;
    doc.text('Local water corporations may add fixed connection and sewage fees', 20, yPos);
    yPos += lineHeight * 0.8;
    doc.text('Tariffs may change during the year based on CPI and electricity costs', 20, yPos);

    // Footer
    yPos = 280;
    doc.setFontSize(8);
    doc.text('Water Bill Calculator - Israel 2026 | Created for public benefit', 105, yPos, { align: 'center' });

    // Save PDF
    doc.save(`water-bill-calculation-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Reset calculator and hide results
 */
function resetCalculator() {
    document.getElementById('waterForm').reset();
    hideResults();
    hideComparison();

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// LOCAL STORAGE FUNCTIONS
// ============================================

/**
 * Save form data to localStorage
 */
function saveToLocalStorage(data) {
    try {
        localStorage.setItem('waterCalculatorData', JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

/**
 * Load form data from localStorage
 */
function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem('waterCalculatorData');
        if (data) {
            const parsed = JSON.parse(data);

            // Restore form values
            if (parsed.consumption) document.getElementById('consumption').value = parsed.consumption;
            if (parsed.persons) document.getElementById('persons').value = parsed.persons;
            if (parsed.period) document.getElementById('period').value = parsed.period;
            if (parsed.hasDisability !== undefined) document.getElementById('disability').checked = parsed.hasDisability;
            if (parsed.year) document.getElementById('year').value = parsed.year;
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the calculator on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    // Load saved data if available
    loadFromLocalStorage();

    // Add form validation
    const consumptionInput = document.getElementById('consumption');
    consumptionInput.addEventListener('input', function() {
        if (this.value < 0) {
            this.value = 0;
        }
    });

    console.log('Water Calculator initialized successfully');
    console.log('Current tariffs (2026):', TARIFFS[2026]);
});

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================

// Expose functions to global scope for inline event handlers
window.toggleInstructions = toggleInstructions;
window.calculateWater = calculateWater;
window.exportToPDF = exportToPDF;
window.resetCalculator = resetCalculator;

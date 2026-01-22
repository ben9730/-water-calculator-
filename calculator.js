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
// ERROR DETECTION FUNCTIONS
// ============================================

/**
 * Toggle error checker box visibility
 */
function toggleErrorChecker() {
    const errorCheckerBox = document.getElementById('errorCheckerBox');
    const toggleIcon = document.querySelector('.error-toggle-btn .toggle-icon');

    errorCheckerBox.classList.toggle('hidden');

    // Rotate the chevron icon
    if (errorCheckerBox.classList.contains('hidden')) {
        toggleIcon.style.transform = 'rotate(0deg)';
    } else {
        toggleIcon.style.transform = 'rotate(180deg)';
        // Smooth scroll to the error checker
        setTimeout(() => {
            errorCheckerBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

/**
 * Check for billing errors
 */
function checkForErrors(event) {
    event.preventDefault();

    // Get form values from main calculator
    const consumption = parseFloat(document.getElementById('consumption').value);
    const persons = parseInt(document.getElementById('persons').value);
    const period = parseInt(document.getElementById('period').value);
    const hasDisability = document.getElementById('disability').checked;

    // Get form values from error checker
    const actualBillAmount = parseFloat(document.getElementById('actualBillAmount').value);
    const billingType = document.getElementById('billingType').value;
    const previousConsumption = parseFloat(document.getElementById('previousConsumption').value);
    const currentMeterReading = parseFloat(document.getElementById('currentMeterReading').value);

    // Validate input
    if (isNaN(consumption) || consumption < 0) {
        alert('אנא הכנס כמות צריכה תקינה במחשבון הראשי');
        return;
    }

    // Calculate expected bill
    const calculatedResult = calculateWaterBill(consumption, persons, period, hasDisability, 2026);

    // Detect errors
    const errors = [];
    const warnings = [];
    const recommendations = [];

    // 1. Check if billing is based on estimation
    if (billingType === 'estimated') {
        errors.push({
            type: 'estimation',
            severity: 'high',
            title: 'חיוב על בסיס הערכה',
            description: 'החשבון שלכם מבוסס על הערכה ולא על קריאה ממונה. זה עלול להוביל לחיוב לא מדויק.',
            action: 'צלמו את המונה בבית ושלחו את התמונה לתאגיד המים עם בקשה לעדכון החשבון. אתם זכאים לזיכוי אם קריאת המונה בפועל נמוכה יותר.'
        });
    }

    // 2. Compare actual bill to calculated bill
    if (!isNaN(actualBillAmount) && actualBillAmount > 0) {
        const difference = actualBillAmount - calculatedResult.totalPrice;
        const percentDiff = Math.abs((difference / calculatedResult.totalPrice) * 100);

        if (percentDiff > 5) {
            if (difference > 0) {
                errors.push({
                    type: 'overcharge',
                    severity: 'high',
                    title: 'חיוב יתר אפשרי',
                    description: `החשבון בפועל (${formatNumber(actualBillAmount)} ₪) גבוה מהחישוב שלנו (${formatNumber(calculatedResult.totalPrice)} ₪) בכ-${formatNumber(Math.abs(difference))} ₪ (${percentDiff.toFixed(1)}%).`,
                    action: 'בדקו שמספר הנפשות בחשבון נכון. ודאו שקיבלתם את כל ההנחות המגיעות לכם. פנו לתאגיד לבירור.'
                });
            } else {
                warnings.push({
                    type: 'undercharge',
                    severity: 'medium',
                    title: 'חיוב חסר אפשרי',
                    description: `החשבון בפועל (${formatNumber(actualBillAmount)} ₪) נמוך מהחישוב שלנו (${formatNumber(calculatedResult.totalPrice)} ₪) בכ-${formatNumber(Math.abs(difference))} ₪. ייתכן חיוב השלמה בעתיד.`,
                    action: 'בדקו שנתוני הצריכה שהזנתם נכונים. חיוב חסר עלול להוביל לחיוב השלמה בחשבונות הבאים.'
                });
            }
        }
    }

    // 3. Check for consumption spike
    if (!isNaN(previousConsumption) && previousConsumption > 0) {
        const consumptionChange = ((consumption - previousConsumption) / previousConsumption) * 100;

        if (consumptionChange > 30) {
            warnings.push({
                type: 'spike',
                severity: 'high',
                title: 'עלייה חדה בצריכה',
                description: `הצריכה עלתה ב-${consumptionChange.toFixed(1)}% לעומת החשבון הקודם (${formatNumber(previousConsumption)} → ${formatNumber(consumption)} מ"ק).`,
                action: 'בדקו דליפות במערכת המים (ברזים, אסלה, מערכת השקיה). אם לא מצאתם דליפה, ייתכן שהמונה פגום - בקשו מהתאגיד לבדוק את המונה.'
            });
        } else if (consumptionChange < -30) {
            warnings.push({
                type: 'drop',
                severity: 'medium',
                title: 'ירידה חדה בצריכה',
                description: `הצריכה ירדה ב-${Math.abs(consumptionChange).toFixed(1)}% לעומת החשבון הקודם (${formatNumber(previousConsumption)} → ${formatNumber(consumption)} מ"ק).`,
                action: 'אם החשבון הקודם היה מבוסס על הערכה גבוהה, זו עשויה להיות תיקון. אחרת, ודאו שקריאת המונה נכונה.'
            });
        }
    }

    // 4. Check allocation efficiency
    const allocationUsagePercent = (calculatedResult.reducedConsumption / calculatedResult.allocation) * 100;
    if (allocationUsagePercent < 70 && persons === 2) {
        recommendations.push({
            type: 'persons',
            severity: 'low',
            title: 'ייתכן שמספר הנפשות שגוי',
            description: `אתם משתמשים רק ב-${allocationUsagePercent.toFixed(0)}% מההקצאה המופחתת שלכם. ייתכן שהתאגיד מחשב לפי 2 נפשות כברירת מחדל.`,
            action: 'אם יש בבית פחות מ-2 נפשות, שקלו לעדכן את התאגיד (אם כי זה עלול להקטין את ההקצאה). אם יש יותר - חובה לעדכן!'
        });
    }

    // 5. Check disability benefit
    if (!hasDisability && consumption > calculatedResult.allocation) {
        recommendations.push({
            type: 'disability',
            severity: 'medium',
            title: 'בדקו זכאות להנחת נכות',
            description: 'אם יש בבית אדם עם נכות 70%+ מביטוח לאומי, אתם זכאים ל-3.5 מ"ק נוספים בתעריף מופחת.',
            action: 'פנו לתאגיד המים עם אישור מביטוח לאומי להפעלת ההנחה. זה יכול לחסוך לכם כסף רב!'
        });
    }

    // 6. Check meter reading validation
    if (!isNaN(currentMeterReading) && currentMeterReading > 0) {
        recommendations.push({
            type: 'meter',
            severity: 'low',
            title: 'קריאת מונה ידנית',
            description: `קריאת המונה הנוכחית: ${formatNumber(currentMeterReading)} מ"ק.`,
            action: 'השוו את הקריאה הזו לקריאה שמופיעה בחשבון. אם יש פער - צלמו את המונה ופנו לתאגיד לתיקון.'
        });
    }

    // Display results
    displayErrorResults(errors, warnings, recommendations, calculatedResult, actualBillAmount);
}

/**
 * Display error detection results
 */
function displayErrorResults(errors, warnings, recommendations, calculatedResult, actualBillAmount) {
    const errorResults = document.getElementById('errorResults');
    const errorsList = document.getElementById('errorsList');
    const recommendedActions = document.getElementById('recommendedActions');

    errorResults.classList.remove('hidden');

    // Clear previous results
    errorsList.innerHTML = '';
    recommendedActions.innerHTML = '';

    // Display errors
    if (errors.length > 0) {
        errors.forEach(error => {
            const errorCard = createErrorCard(error, 'error');
            errorsList.appendChild(errorCard);
        });
    }

    // Display warnings
    if (warnings.length > 0) {
        warnings.forEach(warning => {
            const warningCard = createErrorCard(warning, 'warning');
            errorsList.appendChild(warningCard);
        });
    }

    // Display recommendations
    if (recommendations.length > 0) {
        recommendations.forEach(recommendation => {
            const recommendationCard = createErrorCard(recommendation, 'recommendation');
            errorsList.appendChild(recommendationCard);
        });
    }

    // If no issues found
    if (errors.length === 0 && warnings.length === 0 && recommendations.length === 0) {
        errorsList.innerHTML = `
            <div class="no-errors-found">
                <i class="fas fa-check-circle"></i>
                <h4>לא נמצאו טעויות</h4>
                <p>החשבון שלכם נראה תקין על פי הבדיקה שלנו.</p>
            </div>
        `;
    }

    // Summary
    if (!isNaN(actualBillAmount) && actualBillAmount > 0) {
        const summaryHTML = `
            <div class="error-summary">
                <h4><i class="fas fa-clipboard-list"></i> סיכום השוואה</h4>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="summary-label">חשבון בפועל:</span>
                        <span class="summary-value">${formatNumber(actualBillAmount)} ₪</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">חישוב מצופה:</span>
                        <span class="summary-value">${formatNumber(calculatedResult.totalPrice)} ₪</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">הפרש:</span>
                        <span class="summary-value ${actualBillAmount > calculatedResult.totalPrice ? 'negative' : 'positive'}">
                            ${formatNumber(Math.abs(actualBillAmount - calculatedResult.totalPrice))} ₪
                        </span>
                    </div>
                </div>
            </div>
        `;
        recommendedActions.innerHTML = summaryHTML;
    }

    // Scroll to results
    setTimeout(() => {
        errorResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

/**
 * Create error/warning/recommendation card
 */
function createErrorCard(item, type) {
    const card = document.createElement('div');
    card.className = `error-card ${type} severity-${item.severity}`;

    let iconClass = 'fa-exclamation-triangle';
    if (type === 'error') iconClass = 'fa-times-circle';
    if (type === 'recommendation') iconClass = 'fa-lightbulb';

    card.innerHTML = `
        <div class="error-card-header">
            <i class="fas ${iconClass}"></i>
            <h4>${item.title}</h4>
        </div>
        <div class="error-card-body">
            <p class="error-description">${item.description}</p>
            <div class="error-action">
                <strong><i class="fas fa-hand-point-left"></i> מה לעשות:</strong>
                <p>${item.action}</p>
            </div>
        </div>
    `;

    return card;
}

// ============================================
// NAVIGATION FUNCTION
// ============================================

/**
 * Smooth scroll to a specific section
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================

// Expose functions to global scope for inline event handlers
window.toggleInstructions = toggleInstructions;
window.calculateWater = calculateWater;
window.exportToPDF = exportToPDF;
window.resetCalculator = resetCalculator;
window.toggleErrorChecker = toggleErrorChecker;
window.checkForErrors = checkForErrors;
window.scrollToSection = scrollToSection;

// Global variables
let expenses = [];
let currentCurrency = '$';
let editingIndex = -1;
let categories = ['Food', 'Rent', 'Utilities', 'Entertainment', 'Transportation', 'Other'];

// Check for saved data in localStorage
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeSwitch').checked = true;
    }

    // Load saved data
    loadSavedData();
    
    // Initialize chart
    initializeChart();
    
    // Add event listeners to existing member inputs
    document.querySelectorAll('#membersSection input[type="text"]').forEach(input => {
        input.addEventListener('input', updateMemberCheckboxes);
    });
    
    updateMemberCheckboxes();
    displayExpenses();
    
    // Add Enter key support for amount input
    document.getElementById('expenseAmount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addExpense();
        }
    });

    // Initialize date picker with today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;

    // Set up form validation
    setupFormValidation();

    // Initialize filters
    setupFilters();
});

// Theme switcher
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        updateChartTheme(true);
    } else {
        localStorage.setItem('theme', 'light');
        updateChartTheme(false);
    }
}

// Save data to localStorage
function saveData() {
    // Filter out any expenses with empty fields
    const filteredExpenses = expenses.filter(expense => {
        return expense.amount > 0 && 
               expense.description.trim() !== '' && 
               expense.members && 
               expense.members.length > 0;
    });
    
    // Only save non-empty members
    const members = getMembersList().filter(member => member.trim() !== '');
    
    const data = {
        expenses: filteredExpenses,
        currency: currentCurrency,
        members: members
    };
    
    localStorage.setItem('expenseSplitterData', JSON.stringify(data));
    
    // Update the expenses array with the filtered version
    if (expenses.length !== filteredExpenses.length) {
        expenses = filteredExpenses;
    }
}

// Load data from localStorage
function loadSavedData() {
    const savedData = localStorage.getItem('expenseSplitterData');
    if (savedData) {
        const data = JSON.parse(savedData);
        expenses = data.expenses || [];
        currentCurrency = data.currency || '$';
        
        // Set currency in select
        document.getElementById('currencySelect').value = currentCurrency;
        
        // Load members
        if (data.members && data.members.length > 0) {
            const membersSection = document.getElementById('membersSection');
            membersSection.innerHTML = ''; // Clear existing members
            
            data.members.forEach(member => {
                const div = document.createElement('div');
                div.className = 'member-input';
                div.innerHTML = `
                    <input type="text" placeholder="Enter member name" value="${member}" oninput="updateMemberCheckboxes()">
                    <button class="btn btn-danger" onclick="removeMember(this)" aria-label="Remove member">×</button>
                `;
                membersSection.appendChild(div);
            });
        }
    }
}

// Get current members list
function getMembersList() {
    const memberInputs = document.querySelectorAll('#membersSection input[type="text"]');
    const members = [];
    memberInputs.forEach(input => {
        if (input.value.trim()) {
            members.push(input.value.trim());
        }
    });
    return members;
}

// Update currency
function updateCurrency() {
    const select = document.getElementById('currencySelect');
    currentCurrency = select.value;
    displayExpenses();
    saveData();
    if (document.getElementById('results').style.display !== 'none') {
        calculateSplit();
    }
    updateChart();
}

// Update member checkboxes
function updateMemberCheckboxes() {
    const memberInputs = document.querySelectorAll('#membersSection input[type="text"]');
    const checkboxContainer = document.getElementById('memberCheckboxes');
    checkboxContainer.innerHTML = '';

    memberInputs.forEach((input, index) => {
        if (input.value.trim()) {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="member${index}" value="${input.value.trim()}">
                <label for="member${index}">${input.value.trim()}</label>
            `;
            checkboxContainer.appendChild(div);
        }
    });
    
    saveData();
}

// Toggle all members
function toggleAllMembers(select) {
    const checkboxes = document.querySelectorAll('#memberCheckboxes input[type="checkbox"]');
    
    // If select is true, check all boxes; if false, uncheck all boxes
    checkboxes.forEach(checkbox => {
        checkbox.checked = select;
    });
    
    // Sync the select/deselect checkboxes with the current state
    if (select) {
        document.getElementById('selectAllMembers').checked = true;
        document.getElementById('deselectAllMembers').checked = false;
    } else {
        document.getElementById('selectAllMembers').checked = false;
        document.getElementById('deselectAllMembers').checked = true;
    }
    
    // Reset the triggering checkbox after a short delay
    setTimeout(() => {
        document.getElementById('deselectAllMembers').checked = false;
    }, 100);
}

// Add new member
function addMember() {
    // Check if the last member input is empty
    const existingInputs = document.querySelectorAll('#membersSection input[type="text"]');
    const lastInput = existingInputs[existingInputs.length - 1];
    
    if (lastInput && !lastInput.value.trim()) {
        // Focus on the empty input and show a brief notification
        lastInput.focus();
        lastInput.classList.add('is-invalid');
        
        // Create feedback if it doesn't exist
        if (!lastInput.nextElementSibling || !lastInput.nextElementSibling.classList.contains('invalid-feedback')) {
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = 'Please enter a name first';
            lastInput.parentNode.insertBefore(feedback, lastInput.nextSibling);
        }
        
        // Remove invalid class after a delay
        setTimeout(() => {
            lastInput.classList.remove('is-invalid');
            const feedback = lastInput.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.remove();
            }
        }, 3000);
        
        return;
    }
    
    const membersSection = document.getElementById('membersSection');
    const div = document.createElement('div');
    div.className = 'member-input';
    div.innerHTML = `
        <input type="text" placeholder="Enter member name" oninput="updateMemberCheckboxes()">
        <button class="btn btn-danger" onclick="removeMember(this)" aria-label="Remove member">×</button>
    `;
    membersSection.appendChild(div);
    
    // Focus the new input and scroll into view for mobile
    const newInput = div.querySelector('input');
    newInput.focus();
    newInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    updateMemberCheckboxes();
}

// Remove member
function removeMember(button) {
    button.parentElement.remove();
    updateMemberCheckboxes();
}

// Form validation
function setupFormValidation() {
    const expenseAmount = document.getElementById('expenseAmount');
    const expenseDescription = document.getElementById('expenseDescription');
    
    expenseAmount.addEventListener('input', function() {
        validateField(expenseAmount, expenseAmount.value > 0, 'Please enter a valid amount');
    });
    
    expenseDescription.addEventListener('input', function() {
        validateField(expenseDescription, expenseDescription.value.trim() !== '', 'Please enter a description');
    });
}

function validateField(field, condition, errorMessage) {
    const feedbackElement = field.nextElementSibling;
    
    if (!condition) {
        field.classList.add('is-invalid');
        if (!feedbackElement || !feedbackElement.classList.contains('invalid-feedback')) {
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = errorMessage;
            field.parentNode.insertBefore(feedback, field.nextSibling);
        }
        return false;
    } else {
        field.classList.remove('is-invalid');
        if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
            feedbackElement.remove();
        }
        return true;
    }
}

// Add expense
function addExpense() {
    const amountField = document.getElementById('expenseAmount');
    const descriptionField = document.getElementById('expenseDescription');
    const dateField = document.getElementById('expenseDate');
    const categoryField = document.getElementById('expenseCategory');
    
    const amount = parseFloat(amountField.value);
    const description = descriptionField.value.trim();
    const date = dateField.value;
    const category = categoryField.value;
    const checkboxes = document.querySelectorAll('#memberCheckboxes input[type="checkbox"]:checked');
    
    // Validate inputs
    const amountValid = validateField(
        amountField, 
        amount > 0, 
        'Please enter a valid amount'
    );
    
    const descriptionValid = validateField(
        descriptionField, 
        description !== '', 
        'Please enter a description'
    );
    
    if (!amountValid || !descriptionValid) {
        // Focus the first invalid field for mobile users
        if (!amountValid) {
            amountField.focus();
            amountField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            descriptionField.focus();
            descriptionField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    if (checkboxes.length === 0) {
        // Use a more user-friendly notification instead of alert
        showNotification('Please select at least one member', 'error');
        // Scroll to member selection area
        document.querySelector('.members-selection').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const members = Array.from(checkboxes).map(cb => cb.value);
    
    if (editingIndex >= 0) {
        // Update existing expense
        expenses[editingIndex] = {
            amount: amount,
            description: description,
            date: date,
            category: category,
            members: members
        };
        editingIndex = -1;
    } else {
        // Add new expense
        expenses.push({
            amount: amount,
            description: description,
            date: date,
            category: category,
            members: members
        });
    }

    saveData();
    displayExpenses();
    clearExpenseForm();
    updateChart();
    
    // Show success message and scroll to expense list
    showNotification('Expense added successfully!', 'success');
    document.querySelector('.expense-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Clear expense form
function clearExpenseForm() {
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('expenseCategory').value = 'Other';
    document.querySelectorAll('#memberCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('selectAllMembers').checked = false;
    
    // Clear validation states
    document.getElementById('expenseAmount').classList.remove('is-invalid');
    document.getElementById('expenseDescription').classList.remove('is-invalid');
    const feedbacks = document.querySelectorAll('.invalid-feedback');
    feedbacks.forEach(feedback => feedback.remove());
}

// Edit expense
function editExpense(index) {
    const expense = expenses[index];
    
    // Set form values
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseDescription').value = expense.description || '';
    document.getElementById('expenseDate').value = expense.date || new Date().toISOString().split('T')[0];
    document.getElementById('expenseCategory').value = expense.category || 'Other';
    
    // Clear all checkboxes first
    document.querySelectorAll('#memberCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Check the members in this expense
    expense.members.forEach(member => {
        const checkbox = document.querySelector(`#memberCheckboxes input[value="${member}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    editingIndex = index;
    
    // Scroll to form
    document.querySelector('.add-expense-container').scrollIntoView({ behavior: 'smooth' });
}

// Display expenses
function displayExpenses() {
    const expenseList = document.getElementById('expenseList');
    expenseList.innerHTML = '';

    if (expenses.length === 0) {
        expenseList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No expenses added yet</p>';
        return;
    }

    // Apply filters if they exist
    let filteredExpenses = [...expenses];
    const categoryFilter = document.getElementById('filterCategory');
    const memberFilter = document.getElementById('filterMember');
    const dateFilter = document.getElementById('filterDate');
    
    if (categoryFilter && categoryFilter.value !== 'all') {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === categoryFilter.value);
    }
    
    if (memberFilter && memberFilter.value !== 'all') {
        filteredExpenses = filteredExpenses.filter(expense => expense.members.includes(memberFilter.value));
    }
    
    if (dateFilter && dateFilter.value) {
        filteredExpenses = filteredExpenses.filter(expense => expense.date === dateFilter.value);
    }

    filteredExpenses.forEach((expense, index) => {
        const originalIndex = expenses.indexOf(expense);
        const div = document.createElement('div');
        div.className = 'expense-item';
        
        // Create category class
        const categoryClass = expense.category ? 
            `category-${expense.category.toLowerCase()}` : 'category-other';
        
        div.innerHTML = `
            <div class="expense-header">
                <div>
                    <div class="expense-amount">${currentCurrency}${expense.amount.toFixed(2)}</div>
                    <div class="expense-description">${expense.description || 'No description'}</div>
                    <div class="expense-date">${formatDate(expense.date)}</div>
                    <span class="expense-category ${categoryClass}">${expense.category || 'Other'}</span>
                </div>
                <div class="expense-actions">
                    <button class="btn btn-warning" onclick="editExpense(${originalIndex})" aria-label="Edit expense">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger" onclick="removeExpense(${originalIndex})" aria-label="Remove expense">
                        🗑️ Remove
                    </button>
                </div>
            </div>
            <div class="expense-members">
                <strong>Split between:</strong> ${expense.members.join(', ')} 
                <span style="color: #4facfe; font-weight: 600;">
                    (${currentCurrency}${(expense.amount / expense.members.length).toFixed(2)} each)
                </span>
            </div>
        `;
        expenseList.appendChild(div);
    });
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Remove expense
function removeExpense(index) {
    if (confirm('Are you sure you want to remove this expense?')) {
        expenses.splice(index, 1);
        saveData();
        displayExpenses();
        updateChart();
    }
}

// Calculate split
function calculateSplit() {
    if (expenses.length === 0) {
        alert('Please add at least one expense');
        return;
    }

    // Show loading indicator
    showLoading(true);

    // Simulate calculation delay
    setTimeout(() => {
        const memberTotals = {};
        let grandTotal = 0;

        // Initialize all members with 0
        const allMembers = new Set();
        expenses.forEach(expense => {
            expense.members.forEach(member => allMembers.add(member));
        });

        allMembers.forEach(member => {
            memberTotals[member] = 0;
        });

        // Calculate split for each expense
        expenses.forEach(expense => {
            const splitAmount = expense.amount / expense.members.length;
            expense.members.forEach(member => {
                memberTotals[member] += splitAmount;
            });
            grandTotal += expense.amount;
        });

        displayResults(memberTotals, grandTotal);
        
        // Hide loading indicator
        showLoading(false);
    }, 500);
}

// Display results
function displayResults(memberTotals, grandTotal) {
    const results = document.getElementById('results');
    const resultsGrid = document.getElementById('resultsGrid');
    const totalAmount = document.getElementById('totalAmount');

    resultsGrid.innerHTML = '';

    Object.entries(memberTotals)
        .sort(([,a], [,b]) => b - a) // Sort by amount descending
        .forEach(([member, amount]) => {
            const div = document.createElement('div');
            div.className = 'result-card';
            div.innerHTML = `
                <h3>${member}</h3>
                <div class="amount">${currentCurrency}${amount.toFixed(2)}</div>
            `;
            resultsGrid.appendChild(div);
        });

    totalAmount.textContent = `${currentCurrency}${grandTotal.toFixed(2)}`;
    results.style.display = 'block';
    results.scrollIntoView({ behavior: 'smooth' });
}

// Clear all data
function clearAll() {
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';
    modal.innerHTML = `
        <div class="confirmation-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to clear all expenses? This cannot be undone.</p>
            <div class="confirmation-buttons">
                <button class="btn btn-secondary" id="cancelClearAll">Cancel</button>
                <button class="btn btn-danger" id="confirmClearAll">Delete All</button>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(modal);
    
    // Show with animation
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Add event listeners
    document.getElementById('cancelClearAll').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    document.getElementById('confirmClearAll').addEventListener('click', () => {
        // Clear data
        expenses = [];
        editingIndex = -1;
        saveData();
        displayExpenses();
        clearExpenseForm();
        document.getElementById('results').style.display = 'none';
        updateChart();
        
        // Remove modal
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        
        // Show success notification
        showNotification('All expenses have been cleared', 'success');
    });
}

// Show/hide loading indicator
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Setup filters
function setupFilters() {
    const filterCategory = document.getElementById('filterCategory');
    const filterMember = document.getElementById('filterMember');
    
    // Populate category filter
    if (filterCategory) {
        filterCategory.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach(category => {
            filterCategory.innerHTML += `<option value="${category}">${category}</option>`;
        });
    }
    
    // Populate member filter
    updateMemberFilter();
    
    // Add event listeners
    if (filterCategory) filterCategory.addEventListener('change', displayExpenses);
    if (filterMember) filterMember.addEventListener('change', displayExpenses);
    if (document.getElementById('filterDate')) {
        document.getElementById('filterDate').addEventListener('change', displayExpenses);
    }
    if (document.getElementById('clearFilters')) {
        document.getElementById('clearFilters').addEventListener('click', clearFilters);
    }
}

// Update member filter
function updateMemberFilter() {
    const filterMember = document.getElementById('filterMember');
    if (!filterMember) return;
    
    const members = getMembersList();
    filterMember.innerHTML = '<option value="all">All Members</option>';
    members.forEach(member => {
        filterMember.innerHTML += `<option value="${member}">${member}</option>`;
    });
}

// Clear filters
function clearFilters() {
    const filterCategory = document.getElementById('filterCategory');
    const filterMember = document.getElementById('filterMember');
    const filterDate = document.getElementById('filterDate');
    
    if (filterCategory) filterCategory.value = 'all';
    if (filterMember) filterMember.value = 'all';
    if (filterDate) filterDate.value = '';
    
    displayExpenses();
}

// Export functions
function exportToCSV() {
    if (expenses.length === 0) {
        alert('No expenses to export');
        return;
    }
    
    let csv = 'Amount,Description,Date,Category,Members\n';
    
    expenses.forEach(expense => {
        const row = [
            expense.amount,
            `"${expense.description || 'No description'}"`,
            expense.date || 'No date',
            expense.category || 'Other',
            `"${expense.members.join(', ')}"`
        ];
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'expense_split_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        // Remove from DOM after animation
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Chart functionality
let expenseChart;

function initializeChart() {
    const chartCanvas = document.getElementById('expenseChart');
    if (!chartCanvas) return;
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e0e0e0' : '#333';
    
    expenseChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4facfe', '#00f2fe', '#f093fb', '#f5576c',
                    '#ffd166', '#06d6a0', '#118ab2', '#073b4c'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor
                    }
                },
                title: {
                    display: true,
                    text: 'Expense Distribution by Category',
                    color: textColor,
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
    
    updateChart();
}

function updateChart() {
    if (!expenseChart) return;
    
    // Group expenses by category
    const categoryTotals = {};
    categories.forEach(category => {
        categoryTotals[category] = 0;
    });
    
    expenses.forEach(expense => {
        const category = expense.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    // Filter out categories with no expenses
    const filteredCategories = Object.entries(categoryTotals)
        .filter(([, amount]) => amount > 0)
        .sort(([, a], [, b]) => b - a);
    
    // Update chart data
    expenseChart.data.labels = filteredCategories.map(([category]) => category);
    expenseChart.data.datasets[0].data = filteredCategories.map(([, amount]) => amount);
    
    expenseChart.update();
}

function updateChartTheme(isDark) {
    if (!expenseChart) return;
    
    const textColor = isDark ? '#e0e0e0' : '#333';
    
    expenseChart.options.plugins.legend.labels.color = textColor;
    expenseChart.options.plugins.title.color = textColor;
    
    expenseChart.update();
}

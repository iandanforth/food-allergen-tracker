class AllergenTracker {
    constructor() {
        this.meals = [];
        this.allergens = [
            'peanuts', 'tree-nuts', 'milk', 'egg-whites', 'egg-yolks', 'soy', 
            'wheat', 'fish', 'shellfish', 'sesame'
        ];
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        document.getElementById('mealBtn').addEventListener('click', () => this.showMealModal());
        document.getElementById('mealForm').addEventListener('submit', (e) => this.saveMeal(e));
        
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => this.closeModals());
        });
        
        document.getElementById('closeMealDetailBtn').addEventListener('click', () => this.closeModals());
        document.getElementById('deleteMealBtn').addEventListener('click', () => this.showDeleteConfirmation());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.deleteMeal());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeDeleteConfirmation());
        document.getElementById('editDateBtn').addEventListener('click', () => this.showEditDate());
        document.getElementById('saveDateBtn').addEventListener('click', () => this.saveEditedDate());
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.cancelEditDate());
        
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    async loadData() {
        try {
            await this.loadMeals();
            await this.updateDisplay();
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading data. Please refresh the page.');
        }
    }

    async loadMeals() {
        const response = await fetch('/api/meals');
        if (!response.ok) {
            throw new Error('Failed to load meals');
        }
        this.meals = await response.json();
    }

    showMealModal() {
        // Set default date/time to current
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
        
        document.getElementById('mealDate').value = dateStr;
        document.getElementById('mealTime').value = timeStr;
        
        document.getElementById('mealModal').style.display = 'block';
    }

    closeModals() {
        document.getElementById('mealModal').style.display = 'none';
        document.getElementById('mealDetailModal').style.display = 'none';
        document.getElementById('confirmDeleteModal').style.display = 'none';
    }

    closeDeleteConfirmation() {
        document.getElementById('confirmDeleteModal').style.display = 'none';
    }

    async saveMeal(e) {
        e.preventDefault();
        
        const form = document.getElementById('mealForm');
        const selectedAllergens = Array.from(form.querySelectorAll('input[name="allergens"]:checked'))
            .map(input => input.value);
        
        const dateValue = document.getElementById('mealDate').value;
        const timeValue = document.getElementById('mealTime').value;
        
        if (selectedAllergens.length === 0) {
            alert('Please select at least one allergen.');
            return;
        }
        
        if (!dateValue || !timeValue) {
            alert('Please select both date and time.');
            return;
        }

        const mealDateTime = new Date(`${dateValue}T${timeValue}`);
        const isoString = mealDateTime.toISOString();

        try {
            const response = await fetch('/api/meals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    allergens: selectedAllergens,
                    date: isoString
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save meal');
            }

            await this.loadData();
            this.closeModals();
            form.reset();
        } catch (error) {
            console.error('Error saving meal:', error);
            alert('Error saving meal. Please try again.');
        }
    }

    async updateDisplay() {
        await this.updateAllergenStatus();
        this.updateMealHistory();
    }

    async updateAllergenStatus() {
        try {
            const response = await fetch('/api/allergen-status');
            if (!response.ok) {
                throw new Error('Failed to load allergen status');
            }
            
            const allergenStatus = await response.json();
            const allergenList = document.getElementById('allergenList');
            
            allergenList.innerHTML = '';
            
            allergenStatus.forEach(item => {
                const div = document.createElement('div');
                div.className = `allergen-item ${item.status}`;
                div.innerHTML = `
                    <span class="allergen-name">${item.name.replace('-', ' ')}</span>
                    <span class="time-since">${item.timeSince}</span>
                `;
                allergenList.appendChild(div);
            });
        } catch (error) {
            console.error('Error updating allergen status:', error);
        }
    }

    updateMealHistory() {
        const mealHistory = document.getElementById('mealHistory');
        mealHistory.innerHTML = '';

        if (this.meals.length === 0) {
            mealHistory.innerHTML = '<p>No meals recorded yet.</p>';
            return;
        }

        this.meals.forEach(meal => {
            const div = document.createElement('div');
            div.className = 'meal-item';
            div.addEventListener('click', () => this.showMealDetails(meal));
            
            const date = new Date(meal.date);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            div.innerHTML = `
                <div class="meal-date">${dateStr}</div>
                <div class="meal-allergens">${meal.allergens.map(a => a.replace('-', ' ')).join(', ')}</div>
            `;
            
            mealHistory.appendChild(div);
        });
    }

    showMealDetails(meal) {
        this.currentMealId = meal.id;
        this.currentMeal = meal;
        const modal = document.getElementById('mealDetailModal');
        const details = document.getElementById('mealDetails');
        
        const date = new Date(meal.date);
        const dateStr = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
        
        details.innerHTML = `
            <h3>Meal on ${dateStr}</h3>
            <h4>Allergens included:</h4>
            <ul>
                ${meal.allergens.map(allergen => `<li>${allergen.replace('-', ' ')}</li>`).join('')}
            </ul>
        `;
        
        this.hideEditDate();
        modal.style.display = 'block';
    }

    showDeleteConfirmation() {
        document.getElementById('confirmDeleteModal').style.display = 'block';
    }

    async deleteMeal() {
        if (!this.currentMealId) {
            alert('No meal selected for deletion');
            return;
        }

        try {
            const response = await fetch(`/api/meals/${this.currentMealId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete meal');
            }

            await this.loadData();
            this.closeModals();
            this.currentMealId = null;
        } catch (error) {
            console.error('Error deleting meal:', error);
            alert('Error deleting meal. Please try again.');
        }
    }

    showEditDate() {
        if (!this.currentMeal) return;
        
        const date = new Date(this.currentMeal.date);
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0].substring(0, 5);
        
        document.getElementById('editDate').value = dateStr;
        document.getElementById('editTime').value = timeStr;
        document.getElementById('editDateSection').style.display = 'block';
    }

    hideEditDate() {
        document.getElementById('editDateSection').style.display = 'none';
    }

    cancelEditDate() {
        this.hideEditDate();
    }

    async saveEditedDate() {
        if (!this.currentMealId) {
            alert('No meal selected for editing');
            return;
        }

        const dateValue = document.getElementById('editDate').value;
        const timeValue = document.getElementById('editTime').value;
        
        if (!dateValue || !timeValue) {
            alert('Please select both date and time');
            return;
        }

        const newDateTime = new Date(`${dateValue}T${timeValue}`);
        const isoString = newDateTime.toISOString();

        try {
            const response = await fetch(`/api/meals/${this.currentMealId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ date: isoString })
            });

            if (!response.ok) {
                throw new Error('Failed to update meal date');
            }

            await this.loadData();
            this.hideEditDate();
            
            const updatedMeal = this.meals.find(meal => meal.id === this.currentMealId);
            if (updatedMeal) {
                this.showMealDetails(updatedMeal);
            }
        } catch (error) {
            console.error('Error updating meal date:', error);
            alert('Error updating meal date. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AllergenTracker();
});
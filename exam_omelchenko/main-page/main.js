const API_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';
const API_KEY = 'a0e0eef7-9d99-4b6a-810a-bc875f8ddaa4';

// Состояние приложения
let state = {
    products: [],
    cart: [],
    filters: {
        categories: new Set(),
    },
    sortBy: 'default',
    searchQuery: ''
};


document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
    loadCartFromLocalStorage();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Фильтры
    document.getElementById('sortSelect').addEventListener('change', handleSort);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    // Корзина
    document.getElementById('cartBtn').addEventListener('click', showCart);
}




// Получение товаров с API
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/goods?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка при загрузке данных');
        const data = await response.json();
        state.products = data;
        updateProductsDisplay();
        updateCategories();
    } catch (error) {
        showNotification('Ошибка при загрузке товаров: ' + error.message, 'error');
    }
}

// Обновление отображения товаров
function updateProductsDisplay() {
    const container = document.getElementById('productsContainer');
    const filteredProducts = filterProducts();
    const sortedProducts = sortProducts(filteredProducts);
    const productsToShow = sortedProducts;

    container.innerHTML = productsToShow.map(product => createProductCard(product)).join('');
}

// Создание карточки товара
function createProductCard(product) {
    const discount = product.discount_price ? 
        Math.round((1 - product.discount_price / product.actual_price) * 100) : 0;

    return `
        <div class="product-card">
            <img src="${product.image_url}" alt="${product.name}" loading="lazy">
            <h3 title="${product.name}">${product.name}</h3>
            <div class="product-rating">
                ${createRatingStars(product.rating)}
                <span>${product.rating}</span>
            </div>
            <div class="product-price">
                ${product.discount_price ? 
                    `<span class="original-price">${product.actual_price}₽</span>
                     <span class="discount-price">${product.discount_price}₽</span>
                     <span class="discount-badge">-${discount}%</span>` :
                    `<span class="regular-price">${product.actual_price}₽</span>`
                }
            </div>
            <button class="add-to-cart" onclick="addToCart(${product.id})">
                Добавить
            </button>
        </div>
    `;
}

// Создание звёздочек рейтинга
function createRatingStars(rating) {
    const fullStars = Math.round(rating);
    console.log(fullStars)
    let stars = ``;
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '★';
        
        } else {
            stars += '☆';
        }
    }
    return stars;

}

// Фильтрация товаров
function filterProducts() {
    return state.products.filter(product => {
        // Фильтр по поисковому запросу
        const searchMatch = !state.searchQuery || 
            product.name.toLowerCase().includes(state.searchQuery.toLowerCase());

        return searchMatch;
    });
}

// Сортировка товаровc not done 
function sortProducts(products) {
    const sorted = [...products];
    
    switch (state.sortBy) {
        case 'price-asc':
            sorted.sort((a, b) => (a.discount_price || a.actual_price) - 
                                   (b.discount_price || b.actual_price));
                                   break;
        case 'price-desc':
            sorted.sort((a, b) => (b.discount_price || b.actual_price) - 
                                   (a.discount_price || a.actual_price));
                                   break;
        case 'rating-asc':
            sorted.sort((a, b) => a.rating - b.rating);
            break;
        case 'rating-desc':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
        default:
            break;
    }

    const container = document.getElementById('productsContainer');

    if (!container) {
        console.error("Container element not found");
        return sorted;
    }

    if (sorted.length === 0) {
        console.error("Nothing found");
        
        const noResultsHeader = document.createElement('div');
        noResultsHeader.textContent = 'НИЧЕГО НЕ НАЙДЕНО';
        container.innerHTML = '';
        container.appendChild(noResultsHeader);
    }

    return sorted;
}

// Обновление категорий
function updateCategories() {
    const categories = new Set(state.products.map(p => p.main_category));
    const container = document.getElementById('categoriesContainer');
    
    container.innerHTML = Array.from(categories).map(category => `
        <label class="category-checkbox">
            <input type="checkbox" value="${category}" 
                   ${state.filters.categories.has(category) ? 'checked' : ''}>
            ${category}
        </label>
    `).join('');
}

// Обработчик сортировки
function handleSort(e) {
    state.sortBy = e.target.value;
    updateProductsDisplay();
}
/////////
function handleSearch(e) {
    const input = e.target;
    const query = input.value.trim();
    state.searchQuery = query;
    console.log(query)
    
    state.page = 1;

    
    let suggestionsContainer = document.getElementById('suggestions-container');
    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'suggestions-container';
        input.parentNode.appendChild(suggestionsContainer);
    }

    
    if (query.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    
    fetch(`https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/autocomplete?api_key=${API_KEY}&query=${query}`)
        .then(response => response.json())
        .then(suggestions => {
            
            suggestionsContainer.innerHTML = '';

            if (suggestions.length > 0) {
                


                suggestions.forEach(suggestion => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    div.textContent = suggestion;
                    div.addEventListener('click', () => {
                        input.value = suggestion;
                        suggestionsContainer.style.display = 'none';
                        state.searchQuery = suggestion;
                    });
                    suggestionsContainer.appendChild(div);
                });
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('нет подсказок:', error);
            suggestionsContainer.style.display = 'none';
        });

        
    document.getElementById('searchBtn').addEventListener('click', updateProductsDisplay);
}



// локал сторедж номер корзины
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = state.cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity = 1;
    } else {
        state.cart.push({
            id: productId,
            name: product.name,
            price: product.discount_price || product.actual_price,
            quantity: 1
        });
    }

    saveCartToLocalStorage();
    
    showNotification(`${product.name} добавлен в корзину`);
}

// Сохранение корзины в localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

// Загрузка корзины из localStorage
// function loadCartFromLocalStorage() {
//     const savedCart = localStorage.getItem('cart');
//     if (savedCart) {
//         state.cart = JSON.parse(savedCart)
//         updateCartCount();
//     }
// }

// Обновление счётчика товаров в корзине
/*function updateCartCount() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}*/

// Показ уведомлений
function showNotification(message, type = 'success') {
    const notification = document.createElement('div')
    notification.className = `notification ${type}`

    const deleteNotif = document.createElement('button')
    deleteNotif.className = 'btn-delete-notif'
    deleteNotif.id = 'btn-delete-notif'
    deleteNotif.innerHTML = '&#10005;'
    notification.textContent = message;
    notification.appendChild(deleteNotif);
    
    const container = document.getElementById('notificationArea');
    container.appendChild(notification);

    deleteNotif.addEventListener('click', () => {
        container.removeChild(notification)
    });

    setTimeout(() => {
        if (notification.parentNode === container) {
            container.removeChild(notification);
        }
    }, 3000);
}


function takeOfNotification() {
    notification.classList.add('');
    setTimeout(() => notification.remove());

}
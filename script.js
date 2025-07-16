// ===================================================================
//              VS DETAIL - SCRIPT COMPLETO
// ===================================================================

// FALTA INTEGRAÇÃO COM O DB

document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------------------
    // FUNÇÕES GLOBAIS E GERENCIADOR DE SESSÃO
    // (Executado em todas as páginas)
    // -------------------------------------------------------------------

    const getFromStorage = (key) => {
        const item = localStorage.getItem(key);
        // Lida com arrays (carrinho, usuários, agendamentos) e objetos (usuário logado)
        return item ? JSON.parse(item) : []; 
    };
    
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    const handleUserSession = () => {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Leitura direta para objeto
        const profileLink = document.getElementById('user-profile-link');
        const logoutBtn = document.getElementById('user-logout-btn');

        if (profileLink && logoutBtn) {
            if (loggedInUser && loggedInUser.name) {
                // Usuário está logado
                profileLink.href = 'agendamentos.html';
                logoutBtn.classList.remove('hidden');
            } else {
                // Usuário não está logado
                profileLink.href = 'login.html';
                logoutBtn.classList.add('hidden');
            }

            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const confirmed = confirm('Tem certeza que deseja sair da sua conta?');
                if (confirmed) {
                    localStorage.removeItem('loggedInUser');
                    window.location.href = 'index.html';
                }
            });
        }
    };

    // Chamada inicial do gerenciador de sessão
    handleUserSession();


    // -------------------------------------------------------------------
    // LÓGICA DA PÁGINA PRINCIPAL (INDEX.HTML)
    // -------------------------------------------------------------------
    if (document.querySelector('.service-list')) {
        document.querySelectorAll('.toggle-button').forEach(button => {
            button.addEventListener('click', () => {
                const card = button.closest('.service-card');
                if (card) card.classList.toggle('expanded');
            });
        });

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', () => {
                const card = button.closest('.service-card');
                if (!card) return;
                
                const serviceName = card.dataset.serviceName;
                const servicePrice = parseFloat(card.dataset.servicePrice);
                
                let cart = getFromStorage('cart');
                cart.push({ name: serviceName, price: servicePrice });
                saveToStorage('cart', cart);
                alert(`${serviceName} adicionado ao carrinho!`);
            });
        });
    }


    // -------------------------------------------------------------------
    // LÓGICA DA PÁGINA DE LOGIN E CADASTRO (LOGIN.HTML)
    // -------------------------------------------------------------------
    if (document.getElementById('login-form')) {
        const loginView = document.getElementById('login-view');
        const signupView = document.getElementById('signup-view');
        
        document.getElementById('show-signup').addEventListener('click', (e) => { e.preventDefault(); toggleViews(signupView, loginView); });
        document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); toggleViews(loginView, signupView); });

        const toggleViews = (viewToShow, viewToHide) => {
            viewToShow.classList.remove('hidden');
            viewToHide.classList.add('hidden');
        };
        
        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;
            
            let users = getFromStorage('users');
            if (users.find(user => user.email === email)) {
                alert('Este e-mail já está cadastrado!');
                return;
            }
            users.push({ name, email, pass });
            saveToStorage('users', users);
            alert('Conta criada com sucesso! Faça o login.');
            toggleViews(loginView, signupView);
        });

        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            
            let users = getFromStorage('users');
            const user = users.find(u => u.email === email && u.pass === pass);

            if (user) {
                saveToStorage('loggedInUser', { name: user.name, email: user.email });
                alert(`Bem-vindo, ${user.name}!`);
                window.location.href = 'agendamentos.html';
            } else {
                alert('Login ou senha inválidos.');
            }
        });
    }


    // -------------------------------------------------------------------
    // LÓGICA DA PÁGINA DO CARRINHO (CARRINHO.HTML)
    // -------------------------------------------------------------------
    if (document.getElementById('cart-page')) {
        const cartView = document.getElementById('cart-view');
        const scheduleView = document.getElementById('schedule-view');
        const cartEmpty = document.getElementById('cart-empty');
        const cartFilled = document.getElementById('cart-filled');
        const cartItemsList = document.getElementById('cart-items-list');
        const cartTotalSpan = document.getElementById('cart-total');
        const continueBtn = document.getElementById('continue-to-schedule');

        const renderCart = () => {
            const cart = getFromStorage('cart');
            cartItemsList.innerHTML = ''; 

            if (cart.length === 0) {
                cartEmpty.classList.remove('hidden');
                cartFilled.classList.add('hidden');
            } else {
                cartEmpty.classList.add('hidden');
                cartFilled.classList.remove('hidden');
                
                let total = 0;
                cart.forEach((item, index) => {
                    const listItem = document.createElement('div');
                    listItem.className = 'list-item';
                    listItem.innerHTML = `
                        <p>${item.name}</p>
                        <div class="item-details">
                            <span>R$ ${item.price.toFixed(2)}</span>
                            <button class="remove-item" data-index="${index}" title="Remover item">&times;</button>
                        </div>
                    `;
                    cartItemsList.appendChild(listItem);
                    total += item.price;
                });
                cartTotalSpan.textContent = `R$ ${total.toFixed(2)}`;
            }
        };

        cartItemsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item')) {
                const indexToRemove = parseInt(e.target.dataset.index, 10);
                let cart = getFromStorage('cart');
                cart.splice(indexToRemove, 1); 
                saveToStorage('cart', cart);
                renderCart();
            }
        });

        continueBtn.addEventListener('click', () => {
            cartView.classList.add('hidden');
            scheduleView.classList.remove('hidden');
        });

        const monthYearEl = document.getElementById('month-year');
        const daysEl = document.getElementById('calendar-days');
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');
        const confirmBtn = document.getElementById('confirm-appointment-btn');
        let currentDate = new Date();
        let selectedDate = null;

        const renderCalendar = () => {
            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            monthYearEl.textContent = `${currentDate.toLocaleString('pt-BR', { month: 'long' })} ${year}`;
            daysEl.innerHTML = '';
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
            for (let i = 0; i < firstDayOfMonth; i++) { daysEl.innerHTML += `<div class="day other-month"></div>`; }
            for (let i = 1; i <= lastDateOfMonth; i++) {
                const dayEl = document.createElement('div');
                dayEl.className = 'day';
                dayEl.textContent = i;
                dayEl.dataset.date = new Date(year, month, i).toISOString().split('T')[0];
                if (selectedDate && dayEl.dataset.date === selectedDate) dayEl.classList.add('selected');
                daysEl.appendChild(dayEl);
            }
        };

        daysEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('day') && !e.target.classList.contains('other-month')) {
                const oldSelected = daysEl.querySelector('.selected');
                if (oldSelected) oldSelected.classList.remove('selected');
                e.target.classList.add('selected');
                selectedDate = e.target.dataset.date;
                confirmBtn.disabled = false;
            }
        });
        
        prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
        nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

        confirmBtn.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('loggedInUser'));
            if (!user || !user.name) {
                alert('Você precisa fazer login para agendar!');
                window.location.href = 'login.html';
                return;
            }
            const cartItems = getFromStorage('cart');
            const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
            let appointments = getFromStorage('appointments');
            appointments.push({ user: user.name, userEmail: user.email, date: selectedDate, services: cartItems, total: cartTotal });
            saveToStorage('appointments', appointments);
            saveToStorage('cart', []);
            alert('Agendamento concluído com sucesso!');
            window.location.href = 'agendamentos.html';
        });
        
        renderCart();
        renderCalendar();
    }


    // -------------------------------------------------------------------
    // LÓGICA DA PÁGINA DE AGENDAMENTOS (AGENDAMENTOS.HTML)
    // -------------------------------------------------------------------
    if (document.getElementById('appointments-list')) {
        const appointmentsEmpty = document.getElementById('appointments-empty');
        const appointmentsList = document.getElementById('appointments-list');
        
        const renderUserAppointments = () => {
            const user = JSON.parse(localStorage.getItem('loggedInUser'));
            if (!user || !user.name) {
                window.location.href = 'login.html';
                return;
            }
            const allAppointments = getFromStorage('appointments');
            const userAppointments = allAppointments
                .map((app, index) => ({ ...app, originalIndex: index }))
                .filter(app => app.userEmail === user.email);

            appointmentsList.innerHTML = '';
            if (userAppointments.length === 0) {
                appointmentsEmpty.classList.remove('hidden');
            } else {
                appointmentsEmpty.classList.add('hidden');
                userAppointments.forEach(app => {
                    const date = new Date(app.date);
                    const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                    let servicesHtml = '';
                    app.services.forEach(s => { servicesHtml += `<div class="list-item"><span>${s.name}</span></div>`; });
                    const appointmentGroup = document.createElement('div');
                    appointmentGroup.className = 'appointment-card';
                    appointmentGroup.innerHTML = `
                        <div class="item-list-group">${servicesHtml}<div class="list-item highlight"><span>DIA: ${formattedDate}</span></div></div>
                        <button class="cancel-btn" data-index="${app.originalIndex}">Cancelar Agendamento</button>`;
                    appointmentsList.appendChild(appointmentGroup);
                });
            }
        };

        appointmentsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('cancel-btn')) {
                if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
                    const indexToRemove = parseInt(e.target.dataset.index, 10);
                    let allAppointments = getFromStorage('appointments');
                    allAppointments.splice(indexToRemove, 1);
                    saveToStorage('appointments', allAppointments);
                    renderUserAppointments();
                }
            }
        });
        renderUserAppointments();
    }
    
    // -------------------------------------------------------------------
    // LÓGICA DA PÁGINA DE ADMIN (ADMIN.HTML)
    // -------------------------------------------------------------------
    if (document.getElementById('admin-login-view')) {
        const loginView = document.getElementById('admin-login-view');
        const dashboardView = document.getElementById('admin-dashboard-view');
        const adminLogoutBtn = document.getElementById('admin-logout');
        const adminAppointmentsList = document.getElementById('admin-appointments-list');

        const renderAdminDashboard = () => {
            loginView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            adminLogoutBtn.classList.remove('hidden');
            const appointments = getFromStorage('appointments');
            adminAppointmentsList.innerHTML = '';
            if (appointments.length === 0) {
                adminAppointmentsList.innerHTML = '<p class="info-box">Nenhum serviço marcado no momento.</p>';
                return;
            }
            appointments.forEach((app, index) => {
                const date = new Date(app.date);
                const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                let servicesHtml = '';
                app.services.forEach(s => { servicesHtml += `<div class="service-item">${s.name}</div>`; });
                const card = document.createElement('div');
                card.className = 'admin-appointment-card';
                card.innerHTML = `
                    <h3>CLIENTE: ${app.user.toUpperCase()}</h3>
                    ${servicesHtml}
                    <div class="detail-item highlight">DIA: ${formattedDate}</div>
                    <div class="detail-item">VALOR: R$ ${app.total.toFixed(2)}</div>
                    <button class="cancel-btn" data-index="${index}">Cancelar Agendamento</button>`;
                adminAppointmentsList.appendChild(card);
            });
        };
    
        adminAppointmentsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('cancel-btn')) {
                if (confirm('Tem certeza que deseja cancelar o agendamento deste cliente?')) {
                    const indexToRemove = parseInt(e.target.dataset.index, 10);
                    let appointments = getFromStorage('appointments');
                    appointments.splice(indexToRemove, 1);
                    saveToStorage('appointments', appointments);
                    renderAdminDashboard();
                }
            }
        });
        
        document.getElementById('admin-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;
            if (user === 'admin' && pass === 'admin123') {
                 saveToStorage('isAdminLoggedIn', true);
                 renderAdminDashboard();
            } else { alert('Credenciais de admin inválidas.'); }
        });

        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isAdminLoggedIn');
            window.location.reload();
        });

        if (JSON.parse(localStorage.getItem('isAdminLoggedIn')) === true) {
            renderAdminDashboard();
        }
    }
});
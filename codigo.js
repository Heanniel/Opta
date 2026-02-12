document.addEventListener('DOMContentLoaded', () => {
    // ============ ELEMENTOS PRINCIPALES ============
    const input = document.getElementById('optionInput');
    const addBtn = document.getElementById('addOptionBtn');
    const cardsContainer = document.getElementById('cardsContainer');
    const decideBtn = document.getElementById('decideBtn');
    const clearBtn = document.getElementById('clearBtn');
    const modeToggleBtn = document.getElementById('modeToggleBtn');
    const modeText = modeToggleBtn.querySelector('.mode-text');
    const themeToggle = document.getElementById('themeToggle');
    const countdown = document.getElementById('countdown');
    const countdownNumber = document.getElementById('countdownNumber');
    const countdownFill = document.querySelector('.countdown-fill');
    const content = document.getElementById('mainContent');
    const modeBadge = document.getElementById('currentModeBadge');
    const optionsCounter = document.getElementById('optionsCount');

    // ============ ESTADO ============
    let options = [];
    let mode = 'simple';
    let isDeciding = false;
    let countdownInterval = null;
    let isAnimating = false;
    
    const MIN_SIMPLE_OPTIONS = 2;
    const MAX_SIMPLE_OPTIONS = 3;
    const MAX_MULTIPLE_OPTIONS = 10;

    // ============ FUNCIONES DE ALMACENAMIENTO ============
    function loadFromStorage() {
        try {
            const savedOptions = localStorage.getItem('opta_options');
            options = savedOptions ? JSON.parse(savedOptions) : [];
            
            const savedMode = localStorage.getItem('opta_mode');
            if (savedMode === 'simple' || savedMode === 'multiple') {
                mode = savedMode;
            }
            
            const savedTheme = localStorage.getItem('opta_theme');
            if (savedTheme === 'dark' || savedTheme === 'light') {
                applyTheme(savedTheme);
            } else {
                applyTheme('light');
            }
        } catch (e) {
            options = [];
        }
        
        render();
        updateModeUI();
        updateInputValidation();
    }

    function saveToStorage() {
        localStorage.setItem('opta_options', JSON.stringify(options));
        localStorage.setItem('opta_mode', mode);
    }

    // ============ FUNCIONES DE VALIDACIÓN ============
    function isDuplicateOption(value) {
        const normalizedValue = value.trim().toLowerCase();
        return options.some(option => 
            option.trim().toLowerCase() === normalizedValue
        );
    }

    function getMaxOptions() {
        return mode === 'simple' ? MAX_SIMPLE_OPTIONS : MAX_MULTIPLE_OPTIONS;
    }

    // ============ RENDERIZADO DE CARTAS ============
    function render() {
        cardsContainer.innerHTML = '';
        cardsContainer.classList.remove('animating');
        
        if (options.length === 0) {
            cardsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">
                        <p>No hay opciones aún</p>
                        <small>Escribe una opción arriba y haz clic en "Añadir"</small>
                    </div>
                </div>
            `;
            return;
        }
        
        options.forEach((opt, idx) => {
            const normalizedOpt = opt.trim();
            
            const card = document.createElement('div');
            card.className = 'option-card';
            card.dataset.index = idx;
            card.dataset.value = normalizedOpt;
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-number">${idx + 1}</div>
                    <button class="card-delete-btn" aria-label="Eliminar opción">✕</button>
                </div>
                <div class="card-content">
                    <div class="card-text">${normalizedOpt}</div>
                </div>
            `;
            
            const deleteBtn = card.querySelector('.card-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isDeciding || isAnimating) return;
                
                deleteBtn.disabled = true;
                card.classList.add('removing');
                
                setTimeout(() => {
                    options.splice(idx, 1);
                    saveToStorage();
                    render();
                    updateInputValidation();
                    showNotification('Opción eliminada', 'info');
                }, 300);
            });
            
            cardsContainer.appendChild(card);
        });
        
        updateInputValidation();
    }

    // ============ ACTUALIZAR UI DEL MODO ============
    function updateModeUI() {
        modeText.textContent = mode === 'simple' ? 'Cambiar a Múltiple' : 'Cambiar a Simple';
        
        if (modeBadge) {
            modeBadge.textContent = mode === 'simple' ? 'Simple' : 'Múltiple';
        }
    }

    // ============ VALIDACIÓN DE INPUT ============
    function updateInputValidation() {
        const maxOptions = getMaxOptions();
        
        if (optionsCounter) {
            optionsCounter.textContent = `${options.length}/${maxOptions}`;
            
            if (options.length >= maxOptions) {
                optionsCounter.style.background = 'rgba(229, 62, 62, 0.15)';
                optionsCounter.style.color = 'var(--danger)';
            } else {
                optionsCounter.style.background = 'rgba(56, 161, 105, 0.15)';
                optionsCounter.style.color = 'var(--success)';
            }
        }
        
        if (options.length >= maxOptions) {
            input.disabled = true;
            input.placeholder = `Límite alcanzado (${maxOptions} opciones)`;
            addBtn.disabled = true;
        } else {
            input.disabled = false;
            input.placeholder = 'Escribe una opción';
            addBtn.disabled = false;
        }
    }

    // ============ AÑADIR OPCIÓN ============
    function addOption() {
        if (isDeciding || isAnimating) {
            showNotification('Espera a que termine el proceso', 'error');
            return;
        }
        
        const value = input.value.trim();
        
        if (!value) {
            showNotification('Por favor, escribe una opción', 'error');
            input.focus();
            return;
        }
        
        if (value.length < 2) {
            showNotification('Mínimo 2 caracteres', 'error');
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 2000);
            return;
        }
        
        if (isDuplicateOption(value)) {
            showNotification('Esta opción ya existe', 'warning');
            input.classList.add('error');
            input.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                input.style.animation = '';
                input.classList.remove('error');
            }, 2000);
            return;
        }
        
        const maxOptions = getMaxOptions();
        
        if (options.length >= maxOptions) {
            showNotification(`Máximo ${maxOptions} opciones`, 'error');
            return;
        }
        
        options.push(value);
        input.value = '';
        saveToStorage();
        render();
        input.focus();
        
        showNotification('Opción añadida', 'success');
    }

    // ============ CAMBIAR MODO ============
    function toggleMode() {
        if (isDeciding || isAnimating) {
            showNotification('Espera a que termine el proceso', 'error');
            return;
        }
        
        mode = mode === 'simple' ? 'multiple' : 'simple';
        
        saveToStorage();
        updateModeUI();
        updateInputValidation();
        
        showNotification(`Modo cambiado a ${mode === 'simple' ? 'Simple' : 'Múltiple'}`, 'success');
    }

    // ============ DESHABILITAR BOTONES ============
    function disableAllButtons(disable) {
        const buttons = document.querySelectorAll('button:not(.theme-toggle)');
        buttons.forEach(button => {
            button.disabled = disable;
            button.style.opacity = disable ? '0.6' : '1';
            button.style.cursor = disable ? 'not-allowed' : 'pointer';
        });
        
        input.disabled = disable;
        if (!disable) {
            updateInputValidation();
        }
    }

    // ============ PROCESO OPTA ============
    function decide() {
        if (isDeciding || isAnimating) {
            showNotification('Ya hay un proceso en curso', 'error');
            return;
        }
        
        if (options.length === 0) {
            showNotification('Añade al menos una opción', 'error');
            return;
        }
        
        if (mode === 'simple') {
            if (options.length < MIN_SIMPLE_OPTIONS || options.length > MAX_SIMPLE_OPTIONS) {
                showNotification(`Modo simple: requiere entre ${MIN_SIMPLE_OPTIONS} y ${MAX_SIMPLE_OPTIONS} opciones`, 'error');
                return;
            }
        } else {
            if (options.length < 4) {
                showNotification('Modo múltiple: mínimo 4 opciones', 'error');
                return;
            }
        }
        
        isDeciding = true;
        isAnimating = true;
        disableAllButtons(true);
        
        // Mostrar contador
        countdown.classList.add('active');
        
        let seconds = 3;
        countdownNumber.textContent = seconds;
        countdownFill.style.width = '0%';
        
        countdownInterval = setInterval(() => {
            seconds--;
            countdownNumber.textContent = seconds;
            
            const progress = ((3 - seconds) / 3) * 100;
            countdownFill.style.width = `${progress}%`;
            
            if (seconds <= 0) {
                clearInterval(countdownInterval);
                
                setTimeout(() => {
                    countdown.classList.remove('active');
                    takeFinalDecision();
                }, 500);
            }
        }, 1000);
    }

    // ============ TOMAR DECISIÓN FINAL ============
    function takeFinalDecision() {
        let selected, winnerIndex;
        
        if (mode === 'simple') {
            winnerIndex = Math.floor(Math.random() * options.length);
            selected = options[winnerIndex];
        } else {
            selected = runEliminatoria(options);
            winnerIndex = options.indexOf(selected);
        }
        
        startCasinoAnimation(winnerIndex, selected);
    }

    // ============ ELIMINATORIA ============
    function runEliminatoria(list) {
        let round = [...list];
        
        for (let i = round.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [round[i], round[j]] = [round[j], round[i]];
        }
        
        while (round.length > 1) {
            const nextRound = [];
            
            for (let i = 0; i < round.length; i += 2) {
                if (i + 1 >= round.length) {
                    nextRound.push(round[i]);
                    break;
                }
                nextRound.push(Math.random() < 0.5 ? round[i] : round[i + 1]);
            }
            
            round = nextRound;
        }
        
        return round[0];
    }

    // ============ ANIMACIÓN DE CASINO ============
    function startCasinoAnimation(winnerIndex, selectedOption) {
        const cards = document.querySelectorAll('.option-card');
        const containerRect = cardsContainer.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        const overlay = document.createElement('div');
        overlay.className = 'animation-overlay';
        overlay.innerHTML = `
            <div class="animation-text">Revolviendo las cartas...</div>
            <div class="animation-dots">
                <div class="animation-dot"></div>
                <div class="animation-dot"></div>
                <div class="animation-dot"></div>
            </div>
        `;
        
        cardsContainer.classList.add('animating');
        cardsContainer.appendChild(overlay);
        
        cards.forEach((card, index) => {
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardBack.innerHTML = `
                <div class="card-back-pattern"></div>
                <div class="card-back-symbol">♠️</div>
            `;
            
            card.appendChild(cardBack);
            card.style.transformStyle = 'preserve-3d';
            card.style.transition = 'none';
            
            setTimeout(() => {
                card.style.animation = 'cardFlip 0.6s forwards';
                
                setTimeout(() => {
                    const cardRect = card.getBoundingClientRect();
                    const cardCenterX = cardRect.left + cardRect.width / 2;
                    const cardCenterY = cardRect.top + cardRect.height / 2;
                    const containerRect = cardsContainer.getBoundingClientRect();
                    
                    const startX = (containerRect.left + centerX - 110) - cardCenterX;
                    const startY = (containerRect.top + centerY - 80) - cardCenterY;
                    
                    card.style.setProperty('--start-x', `${startX}px`);
                    card.style.setProperty('--start-y', `${startY}px`);
                    card.style.setProperty('--end-rotate', `${(index % 2 === 0 ? 1 : -1) * (Math.random() * 20 + 10)}deg`);
                    
                    card.style.animation = `moveToCenter 0.8s ${index * 0.1}s forwards`;
                    
                }, 600);
            }, index * 200);
        });
        
        setTimeout(() => {
            overlay.querySelector('.animation-text').textContent = '¡Mezclando cartas!';
            
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.setProperty('--shuffle-x1', `${Math.random() * 100 - 50}px`);
                    card.style.setProperty('--shuffle-y1', `${Math.random() * 60 - 30}px`);
                    card.style.setProperty('--shuffle-rotate1', `${Math.random() * 180 - 90}deg`);
                    
                    card.style.setProperty('--shuffle-x2', `${Math.random() * 80 - 40}px`);
                    card.style.setProperty('--shuffle-y2', `${Math.random() * 40 - 20}px`);
                    card.style.setProperty('--shuffle-rotate2', `${Math.random() * 360 - 180}deg`);
                    
                    card.style.setProperty('--shuffle-x3', `${Math.random() * 60 - 30}px`);
                    card.style.setProperty('--shuffle-y3', `${Math.random() * 30 - 15}px`);
                    card.style.setProperty('--shuffle-rotate3', `${Math.random() * 720 - 360}deg`);
                    
                    card.style.animation = `casinoShuffle 1.5s ${index * 0.05}s infinite`;
                    
                }, index * 50);
            });
            
            setTimeout(() => {
                overlay.querySelector('.animation-text').textContent = '¡Preparando el sobre!';
                
                cards.forEach((card, index) => {
                    card.style.animation = `fadeOutCards 0.5s ${index * 0.05}s forwards`;
                });
                
                setTimeout(() => {
                    content.classList.add('hidden');
                    cardsContainer.classList.add('hidden');
                    
                    overlay.remove();
                    
                    const envelopeContainer = document.createElement('div');
                    envelopeContainer.className = 'envelope-container';
                    envelopeContainer.id = 'envelopeContainer';
                    
                    envelopeContainer.innerHTML = `
                        <div class="envelope" id="envelope">
                            <div class="envelope-front">
                                <div class="envelope-flap"></div>
                                <div class="envelope-seal">?</div>
                            </div>
                            <div class="envelope-back"></div>
                        </div>
                        <div class="letter-reveal" id="letterReveal">
                            <div class="letter-content">
                                <div class="letter-title">¡GANADOR!</div>
                                <div class="letter-winner">${selectedOption}</div>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(envelopeContainer);
                    
                    const envelope = document.getElementById('envelope');
                    const seal = envelope.querySelector('.envelope-seal');
                    const letterReveal = document.getElementById('letterReveal');
                    
                    envelope.addEventListener('click', function openEnvelope() {
                        seal.textContent = '🎉';
                        seal.style.transform = 'translateX(-50%) scale(1.2)';
                        
                        envelope.classList.add('hidden');
                        letterReveal.classList.add('show');
                        
                        const resetBtn = document.createElement('button');
                        resetBtn.className = 'reset-winner-btn';
                        resetBtn.id = 'resetWinnerBtn';
                        resetBtn.textContent = 'Volver a las opciones';
                        
                        resetBtn.addEventListener('click', function resetGame() {
                            content.classList.remove('hidden');
                            cardsContainer.classList.remove('hidden');
                            
                            const envelopeContainer = document.getElementById('envelopeContainer');
                            if (envelopeContainer) envelopeContainer.remove();
                            
                            this.remove();
                            
                            cardsContainer.innerHTML = '';
                            render();
                            updateInputValidation();
                            isDeciding = false;
                            isAnimating = false;
                            disableAllButtons(false);
                        });
                        
                        document.body.appendChild(resetBtn);
                        
                        createConfetti();
                        
                        const modeName = mode === 'simple' ? 'Decidido' : 'Ganador';
                        showNotification(`${modeName}: ${selectedOption}`, 'success', 5000);
                        
                        envelope.removeEventListener('click', openEnvelope);
                    });
                    
                }, 800);
                
            }, 3000);
            
        }, 2000);
    }

    // ============ CONFETI ============
    function createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.id = 'confettiContainer';
        
        const colors = ['#4a90e2', '#38a169', '#e65a5a', '#ed8936', '#7bb1f0'];
        
        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confetti.style.width = `${Math.random() * 12 + 6}px`;
            confetti.style.height = `${Math.random() * 18 + 12}px`;
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = `${Math.random() * 2 + 3}s`;
            confettiContainer.appendChild(confetti);
        }
        
        document.body.appendChild(confettiContainer);
        
        setTimeout(() => {
            const container = document.getElementById('confettiContainer');
            if (container) container.remove();
        }, 5000);
    }

    // ============ NOTIFICACIONES ============
    function showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        let icon = '💡';
        if (type === 'error') icon = '⚠️';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';
        
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-text">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(150%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, duration);
    }

    // ============ LIMPIAR TODO ============
    function clearAll() {
        if (isDeciding || isAnimating) {
            showNotification('Espera a que termine el proceso', 'error');
            return;
        }
        
        if (options.length === 0) {
            showNotification('No hay opciones para limpiar', 'info');
            return;
        }
        
        if (confirm(`¿Eliminar las ${options.length} opciones?`)) {
            options = [];
            saveToStorage();
            render();
            updateInputValidation();
            showNotification('Opciones eliminadas', 'info');
        }
    }

    // ============ TEMA ============
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark');
            themeToggle.setAttribute('aria-label', 'Cambiar a tema claro');
        } else {
            document.body.classList.remove('dark');
            themeToggle.setAttribute('aria-label', 'Cambiar a tema oscuro');
        }
        localStorage.setItem('opta_theme', theme);
    }

    // ============ EVENT LISTENERS ============
    addBtn.addEventListener('click', addOption);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addOption();
    });
    
    input.addEventListener('input', () => {
        input.classList.remove('error');
        input.style.animation = '';
    });
    
    decideBtn.addEventListener('click', decide);
    clearBtn.addEventListener('click', clearAll);
    modeToggleBtn.addEventListener('click', toggleMode);
    
    themeToggle.addEventListener('click', () => {
        if (isDeciding || isAnimating) return;
        const isDark = document.body.classList.contains('dark');
        applyTheme(isDark ? 'light' : 'dark');
    });

    // ============ INICIALIZACIÓN ============
    loadFromStorage();
    
    setTimeout(() => {
        input.focus();
    }, 300);
});
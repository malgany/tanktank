export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false,
            shift: false,
            1: false,
            2: false,
            3: false
        };

        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.maxStickDistance = 42;
        this.mobileMediaQuery = window.matchMedia('(max-width: 900px) and (hover: none) and (pointer: coarse)');
        this.isMobile = this.mobileMediaQuery.matches;
        this.virtualSticks = {
            left: this.createVirtualStick('left'),
            right: this.createVirtualStick('right')
        };

        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleKeyUp = this.handleKeyUp.bind(this);
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        this.boundHandleViewportChange = this.handleViewportChange.bind(this);
        this.boundHandlePointerMove = this.handlePointerMove.bind(this);
        this.boundHandlePointerUp = this.handlePointerUp.bind(this);

        window.addEventListener('keydown', this.boundHandleKeyDown);
        window.addEventListener('keyup', this.boundHandleKeyUp);
        window.addEventListener('resize', this.boundHandleViewportChange);
        this.game.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
        this.game.canvas.addEventListener('mousedown', this.boundHandleMouseDown);
        this.game.canvas.addEventListener('mouseup', this.boundHandleMouseUp);

        this.setupMobileControls();
        this.syncMobileUiState();

        this.inputInterval = setInterval(this.processInput.bind(this), 16);
    }

    createVirtualStick(side) {
        return {
            side,
            pointerId: null,
            active: false,
            originX: 0,
            originY: 0,
            x: 0,
            y: 0,
            magnitude: 0,
            element: document.getElementById(side === 'left' ? 'leftJoystick' : 'rightJoystick'),
            knob: document.querySelector(side === 'left' ? '#leftJoystick .touch-joystick-knob' : '#rightJoystick .touch-joystick-knob'),
            zone: document.querySelector(`.touch-zone-${side}`)
        };
    }

    setupMobileControls() {
        this.mobileTouchControls = document.getElementById('mobileTouchControls');

        Object.values(this.virtualSticks).forEach((stick) => {
            if (!stick.zone) {
                return;
            }

            stick.zone.addEventListener('pointerdown', (event) => {
                this.handlePointerDown(stick.side, event);
            });
        });

        window.addEventListener('pointermove', this.boundHandlePointerMove, { passive: false });
        window.addEventListener('pointerup', this.boundHandlePointerUp, { passive: false });
        window.addEventListener('pointercancel', this.boundHandlePointerUp, { passive: false });
    }

    syncMobileUiState() {
        if (this.mobileTouchControls) {
            this.mobileTouchControls.setAttribute('aria-hidden', String(!this.isMobile));
        }

        if (!this.isMobile) {
            this.deactivateStick('left');
            this.deactivateStick('right');
            this.mouseDown = false;
        }
    }

    handleViewportChange() {
        const wasMobile = this.isMobile;
        this.isMobile = this.mobileMediaQuery.matches;

        if (wasMobile !== this.isMobile) {
            this.syncMobileUiState();
        }
    }

    handleKeyDown(event) {
        if (event.key.toLowerCase() === 'm') {
            if (!this.game.isFullMapVisible) {
                this.game.showFullMap();
            } else {
                this.game.hideFullMap();
            }
            event.preventDefault();
            return;
        }

        if (event.key.toLowerCase() === 'i') {
            this.game.togglePlayerInfo();
            event.preventDefault();
            return;
        }

        if (event.key.toLowerCase() === 'p') {
            this.game.ui.showPowerInfo();
            event.preventDefault();
            return;
        }

        if (event.key === '0') {
            console.log('PosiÃ§Ã£o atual:', window.debugGame.getCurrentPosition());
            return;
        }

        if (event.key === '1' || event.key === '2' || event.key === '3') {
            this.keys[event.key] = true;
            this.selectPower(parseInt(event.key, 10));
            event.preventDefault();
            return;
        }

        switch (event.key.toLowerCase()) {
            case 'w':
                this.keys.w = true;
                break;
            case 'a':
                this.keys.a = true;
                break;
            case 's':
                this.keys.s = true;
                break;
            case 'd':
                this.keys.d = true;
                break;
            case ' ':
                this.keys.space = true;
                break;
            case 'shift':
                this.keys.shift = true;
                break;
        }

        if (['w', 'a', 's', 'd', ' ', 'shift', 'm', 'i', 'p', '0', '1', '2', '3'].includes(event.key.toLowerCase())) {
            event.preventDefault();
        }
    }

    handleKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case 'w':
                this.keys.w = false;
                break;
            case 'a':
                this.keys.a = false;
                break;
            case 's':
                this.keys.s = false;
                break;
            case 'd':
                this.keys.d = false;
                break;
            case ' ':
                this.keys.space = false;
                break;
            case 'shift':
                this.keys.shift = false;
                break;
            case '1':
            case '2':
            case '3':
                this.keys[event.key] = false;
                break;
        }
    }

    selectPower(keyNumber) {
        const player = this.game.player;

        switch (keyNumber) {
            case 1:
                player.usePower();
                break;
            case 2:
            case 3:
                break;
        }
    }

    handleMouseMove(event) {
        if (this.isMobile) {
            return;
        }

        const rect = this.game.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        this.updatePlayerDirection();
    }

    handleMouseDown(event) {
        if (this.isMobile) {
            return;
        }

        if (event.button === 0) {
            this.mouseDown = true;
        }
    }

    handleMouseUp(event) {
        if (this.isMobile) {
            return;
        }

        if (event.button === 0) {
            this.mouseDown = false;
        }
    }

    handlePointerDown(side, event) {
        if (!this.isMobile || event.pointerType === 'mouse') {
            return;
        }

        const stick = this.virtualSticks[side];
        if (!stick || stick.active) {
            return;
        }

        event.preventDefault();
        stick.pointerId = event.pointerId;
        stick.active = true;
        stick.originX = event.clientX;
        stick.originY = event.clientY;
        this.updateStickPosition(stick, event.clientX, event.clientY);
        this.renderStick(stick, true);
    }

    handlePointerMove(event) {
        if (!this.isMobile || event.pointerType === 'mouse') {
            return;
        }

        const stick = this.getStickByPointerId(event.pointerId);
        if (!stick) {
            return;
        }

        event.preventDefault();
        this.updateStickPosition(stick, event.clientX, event.clientY);
        this.renderStick(stick, true);

        if (stick.side === 'right' && stick.magnitude > 0.12) {
            this.updateAimFromVector(stick.x, stick.y);
        }
    }

    handlePointerUp(event) {
        const stick = this.getStickByPointerId(event.pointerId);
        if (!stick) {
            return;
        }

        event.preventDefault();
        this.deactivateStick(stick.side);
    }

    getStickByPointerId(pointerId) {
        return Object.values(this.virtualSticks).find((stick) => stick.pointerId === pointerId) || null;
    }

    updateStickPosition(stick, clientX, clientY) {
        const deltaX = clientX - stick.originX;
        const deltaY = clientY - stick.originY;
        const distance = Math.hypot(deltaX, deltaY);
        const limitedDistance = Math.min(distance, this.maxStickDistance);
        const scale = distance === 0 ? 0 : limitedDistance / distance;

        stick.x = deltaX * scale;
        stick.y = deltaY * scale;
        stick.magnitude = this.maxStickDistance === 0 ? 0 : limitedDistance / this.maxStickDistance;
    }

    renderStick(stick, isActive) {
        if (!stick.element || !stick.knob) {
            return;
        }

        const zoneRect = stick.zone ? stick.zone.getBoundingClientRect() : { left: 0, top: 0 };
        stick.element.style.left = `${stick.originX - zoneRect.left}px`;
        stick.element.style.top = `${stick.originY - zoneRect.top}px`;
        stick.element.classList.toggle('active', isActive);
        stick.knob.style.transform = `translate(${stick.x}px, ${stick.y}px)`;
    }

    deactivateStick(side) {
        const stick = this.virtualSticks[side];
        if (!stick) {
            return;
        }

        stick.pointerId = null;
        stick.active = false;
        stick.x = 0;
        stick.y = 0;
        stick.magnitude = 0;
        this.renderStick(stick, false);

        if (side === 'right') {
            this.mouseDown = false;
        }
    }

    updatePlayerDirection() {
        const playerCenterX = this.game.player.x + this.game.player.width / 2;
        const playerCenterY = this.game.player.y + this.game.player.height / 2;
        const angleRad = Math.atan2(this.mouseY - playerCenterY, this.mouseX - playerCenterX);
        this.applyAimAngle(angleRad);
    }

    updateAimFromVector(x, y) {
        if (x === 0 && y === 0) {
            return;
        }

        const angleRad = Math.atan2(y, x);
        this.applyAimAngle(angleRad);
    }

    applyAimAngle(angleRad) {
        const angleDeg = angleRad * 180 / Math.PI;

        if (angleDeg >= -45 && angleDeg < 45) {
            this.game.player.setDirection('right');
        } else if (angleDeg >= 45 && angleDeg < 135) {
            this.game.player.setDirection('down');
        } else if (angleDeg >= -135 && angleDeg < -45) {
            this.game.player.setDirection('up');
        } else {
            this.game.player.setDirection('left');
        }

        this.game.player.angle = angleRad;
    }

    processInput() {
        let moveX = 0;
        let moveY = 0;

        if (this.isMobile && this.virtualSticks.left.active) {
            const leftStick = this.virtualSticks.left;
            moveX = leftStick.magnitude > 0.12 ? leftStick.x / this.maxStickDistance : 0;
            moveY = leftStick.magnitude > 0.12 ? leftStick.y / this.maxStickDistance : 0;
        } else {
            if (this.keys.w) moveY = -1;
            if (this.keys.s) moveY = 1;
            if (this.keys.a) moveX = -1;
            if (this.keys.d) moveX = 1;
        }

        this.game.player.setMovement(moveX, moveY);

        if (this.isMobile) {
            const rightStick = this.virtualSticks.right;
            if (rightStick.active && rightStick.magnitude > 0.12) {
                this.updateAimFromVector(rightStick.x, rightStick.y);
                this.mouseDown = rightStick.magnitude > 0.25;
            } else if (!rightStick.active) {
                this.mouseDown = false;
            }
        } else if (moveX !== 0 || moveY !== 0) {
            this.updatePlayerDirection();
        }

        if (this.mouseDown) {
            this.game.player.usePower();
        }

        if (this.keys.space) {
            this.keys.space = false;
        }
    }

    cleanup() {
        window.removeEventListener('keydown', this.boundHandleKeyDown);
        window.removeEventListener('keyup', this.boundHandleKeyUp);
        window.removeEventListener('resize', this.boundHandleViewportChange);
        window.removeEventListener('pointermove', this.boundHandlePointerMove);
        window.removeEventListener('pointerup', this.boundHandlePointerUp);
        window.removeEventListener('pointercancel', this.boundHandlePointerUp);
        this.game.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
        this.game.canvas.removeEventListener('mousedown', this.boundHandleMouseDown);
        this.game.canvas.removeEventListener('mouseup', this.boundHandleMouseUp);
        clearInterval(this.inputInterval);
    }
}

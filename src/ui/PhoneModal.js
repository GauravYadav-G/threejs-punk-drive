/**
 * PhoneModal.js
 * Cyberpunk Holo-Phone / Messages Terminal interface.
 * Connects with Night City Fixers (Rogue, Vik, Judy, Mr. Hands), tracks street missions,
 * and sets active HUD objectives.
 */

export class PhoneModal {
  constructor(soundManager, onSelectMission) {
    this.sound = soundManager;
    this.onSelectMission = onSelectMission;

    this.modal = document.getElementById('modal-phone');
    this.container = document.getElementById('modal-container');
    this.inboxList = document.getElementById('phone-inbox');
    this.clockEl = document.getElementById('phone-clock');
    this.unreadBadge = document.getElementById('unread-badge');

    // Chat view elements
    this.contactAvatar = document.getElementById('contact-avatar');
    this.contactName = document.getElementById('contact-name');
    this.chatBody = document.getElementById('chat-body-text');
    this.missionHeadline = document.getElementById('mission-headline');
    this.missionDesc = document.getElementById('mission-objective-desc');
    this.trackMissionBtn = document.getElementById('track-mission-btn');

    this.contacts = [
      {
        id: 'rogue',
        name: 'Rogue Amendiares',
        role: 'AFTERLIFE QUEEN',
        avatar: 'R',
        color: '#ff007f',
        preview: 'Got an express job for you, merc...',
        message: 'The Tyger Claws are hosting a street drift sprint through Japantown. Rack up at least a 5,000 pt drift combo or reach 240 KM/H on the northern highway. Don\'t scratch the paint.',
        mission: {
          title: 'Drift Combo Master',
          desc: 'Achieve at least 5,000 drift points in a single combo.',
          targetPoints: 5000,
          type: 'drift'
        }
      },
      {
        id: 'viktor',
        name: 'Viktor Vector',
        role: 'WATSON RIPPERDOC',
        avatar: 'V',
        color: '#00f3ff',
        preview: 'Heard you tuned up your engine...',
        message: 'Hey kid, that Quadra has got some serious chrome under the hood. Take it onto the open expressway and open up the throttle. See if you can break past 220 KM/H.',
        mission: {
          title: 'High Velocity Run',
          desc: 'Reach a top speed of 220 KM/H on the highway.',
          targetSpeed: 220,
          type: 'speed'
        }
      },
      {
        id: 'judy',
        name: 'Judy Alvarez',
        role: 'MOX TECH SPECIALIST',
        avatar: 'J',
        color: '#39ff88',
        preview: 'Lost 5 encrypted sigil beacons...',
        message: 'Hey! Some Netrunners dropped 5 encrypted holographic sigils along the highway (Crossed Katanas, Arcade Stick, Dead Man\'s Step, Wetware Brain, Stim Shot). Drive through them to decrypt the data!',
        mission: {
          title: 'Sigil Scavenger Hunt',
          desc: 'Collect all 5 floating neon holographic sigils along the highway.',
          targetCount: 5,
          type: 'sigils'
        }
      },
      {
        id: 'hands',
        name: 'Mr. Hands',
        role: 'PACIFICA FIXER',
        avatar: 'H',
        color: '#ffe600',
        preview: 'Discreet proposition for an agile driver...',
        message: 'Client in Dogtown needs an urgent courier run. Keep your nitro charged and avoid colliding with road barriers. Nitro boost for a continuous 5 seconds.',
        mission: {
          title: 'Nitro Overdrive',
          desc: 'Engage nitro plasma boost for at least 5 continuous seconds.',
          targetSeconds: 5,
          type: 'nitro'
        }
      }
    ];

    this.selectedContactIndex = 0;
    this.init();
  }

  init() {
    this.setupInbox();
    this.setupListeners();
    this.updateClock();
    setInterval(() => this.updateClock(), 30000);
    this.selectContact(0);
  }

  setupInbox() {
    if (!this.inboxList) return;
    this.inboxList.innerHTML = '';

    this.contacts.forEach((contact, idx) => {
      const item = document.createElement('div');
      item.className = `contact-item ${idx === this.selectedContactIndex ? 'active' : ''}`;
      item.dataset.index = idx;

      item.innerHTML = `
        <div class="c-avatar" style="background:${contact.color}">${contact.avatar}</div>
        <div class="c-meta">
          <div class="c-name">${contact.name}</div>
          <div class="c-preview">${contact.preview}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        this.selectContact(idx);
        this.sound?.playUiBeep(720);
      });

      this.inboxList.appendChild(item);
    });
  }

  selectContact(idx) {
    this.selectedContactIndex = idx;
    const contact = this.contacts[idx];
    if (!contact) return;

    // Update highlight
    document.querySelectorAll('.contact-item').forEach((item, i) => {
      if (i === idx) item.classList.add('active');
      else item.classList.remove('active');
    });

    if (this.contactAvatar) {
      this.contactAvatar.textContent = contact.avatar;
      this.contactAvatar.style.background = contact.color;
    }
    if (this.contactName) this.contactName.textContent = contact.name;
    if (this.chatBody) this.chatBody.textContent = contact.message;

    if (this.missionHeadline) this.missionHeadline.textContent = contact.mission.title;
    if (this.missionDesc) this.missionDesc.textContent = contact.mission.desc;
  }

  setupListeners() {
    this.trackMissionBtn?.addEventListener('click', () => {
      const currentContact = this.contacts[this.selectedContactIndex];
      this.sound?.playUiBeep(1100, 0.12);
      if (this.onSelectMission && currentContact) {
        this.onSelectMission(currentContact.mission);
      }
      this.close();
    });
  }

  updateClock() {
    if (!this.clockEl) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    this.clockEl.textContent = `${hours}:${mins} AM`;
  }

  open() {
    this.modal?.classList.remove('hidden');
    this.container?.classList.remove('hidden');
    this.unreadBadge?.classList.add('hidden');
    this.sound?.playUiBeep(640);
  }

  close() {
    this.modal?.classList.add('hidden');
    this.container?.classList.add('hidden');
  }
}

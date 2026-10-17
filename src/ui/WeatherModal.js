/**
 * WeatherModal.js
 * Controls environment atmosphere conditions (Dry, Neon Rain, Thunderstorm, Acid Fog),
 * time of night (Midnight, Sunset, Dawn), and wet road reflection gloss.
 */

export class WeatherModal {
  constructor(weatherSystem, soundManager) {
    this.weather = weatherSystem;
    this.sound = soundManager;

    this.modal = document.getElementById('modal-weather');
    this.container = document.getElementById('modal-container');

    this.weatherButtons = document.querySelectorAll('#weather-options .opt-btn');
    this.timeButtons = document.querySelectorAll('#time-options .opt-btn');

    this.init();
  }

  init() {
    this.weatherButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.weatherButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.weather;
        this.weather.setWeather(mode);
        this.sound?.playUiBeep(680);
      });
    });

    this.timeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.timeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const time = btn.dataset.time;
        this.weather.setTimeOfDay(time);
        this.sound?.playUiBeep(740);
      });
    });
  }

  open() {
    this.modal?.classList.remove('hidden');
    this.container?.classList.remove('hidden');
    this.sound?.playUiBeep(520);
  }

  close() {
    this.modal?.classList.add('hidden');
    this.container?.classList.add('hidden');
  }
}

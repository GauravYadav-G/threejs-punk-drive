/**
 * YouTubeRadioManager.js
 * High-fidelity YouTube Music & Streamer for GTA VI: Vice City Drive.
 * Streams real GTA VI songs (Tom Petty - Love Is A Long Road, The Weeknd, Vice City Classics)
 * and allows players to paste ANY YouTube URL to play directly in-game.
 */

export class YouTubeRadioManager {
  constructor(onTrackChange = null, onStateChange = null) {
    this.onTrackChange = onTrackChange;
    this.onStateChange = onStateChange;

    this.player = null;
    this.isReady = false;
    this.isPlaying = false;
    this.volume = 80;
    this.currentIndex = 0;

    // Curated GTA VI & Vice City YouTube Playlist
    this.playlist = [
      {
        id: "QdBZY2fkU-0",
        title: "Love Is A Long Road (Official GTA VI Trailer 1)",
        artist: "Tom Petty // Rockstar Games",
        station: "FLASH FM 103.5"
      },
      {
        id: "2nL80y0V8H0",
        title: "Love Is A Long Road (Original Full Master)",
        artist: "Tom Petty // Full Moon Fever",
        station: "FLASH FM 103.5"
      },
      {
        id: "4NRXx6U8ABQ",
        title: "Blinding Lights (Leonida 80s Sunset Mix)",
        artist: "The Weeknd // Wave 103",
        station: "WAVE 103"
      },
      {
        id: "s_8KR-n2fBQ",
        title: "Out of Touch (Flash FM Vice City Legend)",
        artist: "Hall & Oates // Flash FM",
        station: "FLASH FM 103.5"
      },
      {
        id: "8UVNT4wvIGY",
        title: "Self Control (Ocean Drive 80s Club Mix)",
        artist: "Laura Branigan // Wave 103",
        station: "WAVE 103"
      },
      {
        id: "IGqeyQhBPMI",
        title: "Resonance (Vice City Sunset Drift)",
        artist: "HOME // Chillwave FM",
        station: "CHILLWAVE FM"
      },
      {
        id: "L_LUpnjgPso",
        title: "Midnight City (Biscayne Bay Sunset)",
        artist: "M83 // Leonida Waves",
        station: "LEONIDA SOUNDS"
      },
      {
        id: "djV11Xbc914",
        title: "Take On Me (Vice City Flash FM Classic)",
        artist: "A-Ha // Flash FM",
        station: "FLASH FM 103.5"
      },
      {
        id: "Kj-a8XzLg0M",
        title: "Grand Theft Auto: Vice City Official Theme",
        artist: "Rockstar Games // VCPD Radio",
        station: "V-ROCK"
      }
    ];

    this.initYouTubeApi();
  }

  initYouTubeApi() {
    // 1. Create hidden DOM holder for YouTube IFrame
    if (!document.getElementById('yt-player-container')) {
      const holder = document.createElement('div');
      holder.id = 'yt-player-container';
      holder.style.position = 'fixed';
      holder.style.bottom = '-9999px';
      holder.style.left = '-9999px';
      holder.style.width = '1px';
      holder.style.height = '1px';
      holder.style.opacity = '0';
      holder.style.pointerEvents = 'none';
      document.body.appendChild(holder);
    }

    // 2. Load YouTube IFrame API script if not present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // 3. Bind API ready hook
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousReady) previousReady();
      this.buildPlayer();
    };

    if (window.YT && window.YT.Player) {
      this.buildPlayer();
    }
  }

  buildPlayer() {
    try {
      this.player = new window.YT.Player('yt-player-container', {
        height: '1',
        width: '1',
        videoId: this.playlist[0].id,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            this.isReady = true;
            this.player.setVolume(this.volume);
            console.log('%c GTA VI YOUTUBE RADIO READY ', 'background: #ff007f; color: #fff; font-weight: bold;');
            if (this.onTrackChange) this.onTrackChange(this.getCurrentTrack());
          },
          onStateChange: (event) => {
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (event.data === 1) {
              this.isPlaying = true;
            } else if (event.data === 2 || event.data === 0) {
              this.isPlaying = false;
              if (event.data === 0) {
                // Auto play next song when current track ends
                this.next();
              }
            }
            if (this.onStateChange) this.onStateChange(this.isPlaying);
          },
          onError: (event) => {
            console.warn('[YouTube Radio Error]:', event.data, '- Skipping to next track');
            this.next();
          }
        }
      });
    } catch (e) {
      console.warn('Failed to build YouTube Player:', e);
    }
  }

  getCurrentTrack() {
    return this.playlist[this.currentIndex] || this.playlist[0];
  }

  play() {
    if (!this.player || !this.isReady) return;
    try {
      this.player.playVideo();
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange(true);
      if (this.onTrackChange) this.onTrackChange(this.getCurrentTrack());
    } catch (e) {
      console.warn('Play error:', e);
    }
  }

  pause() {
    if (!this.player || !this.isReady) return;
    try {
      this.player.pauseVideo();
      this.isPlaying = false;
      if (this.onStateChange) this.onStateChange(false);
    } catch (e) {
      console.warn('Pause error:', e);
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.loadCurrentTrack(true);
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadCurrentTrack(true);
  }

  loadCurrentTrack(autoplay = true) {
    const track = this.getCurrentTrack();
    if (this.player && this.isReady) {
      if (autoplay) {
        this.player.loadVideoById(track.id);
        this.isPlaying = true;
      } else {
        this.player.cueVideoById(track.id);
      }
    }
    if (this.onTrackChange) this.onTrackChange(track);
  }

  selectTrackByIndex(index) {
    if (index >= 0 && index < this.playlist.length) {
      this.currentIndex = index;
      this.loadCurrentTrack(true);
    }
  }

  /**
   * Parse ANY YouTube link and immediately stream in-game!
   * Handles youtu.be, youtube.com/watch?v=, shorts, embed, and music.youtube.com
   */
  playCustomUrl(url) {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return { success: false, message: 'Invalid YouTube link or ID' };
    }

    const customTrack = {
      id: videoId,
      title: `Custom YouTube Stream (${videoId})`,
      artist: "User Station // Vice City Live",
      station: "CUSTOM STREAM"
    };

    // Add to top of playlist and play
    this.playlist.unshift(customTrack);
    this.currentIndex = 0;
    this.loadCurrentTrack(true);

    return { success: true, track: customTrack };
  }

  extractVideoId(input) {
    if (!input) return null;
    input = input.trim();

    // Direct 11-char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }

    // youtu.be/ID
    const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    // youtube.com/watch?v=ID or music.youtube.com/watch?v=ID
    const longMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (longMatch) return longMatch[1];

    // youtube.com/shorts/ID or embed/ID
    const embedMatch = input.match(/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    return null;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    if (this.player && this.isReady) {
      this.player.setVolume(this.volume);
    }
  }

  getVolume() {
    return this.volume;
  }
}

import dashjs from 'modules/dashjs';
import Hls from 'modules/hls.js';

const logger = window.targetAPI.logger;

export enum PlayerType {
    Html,
    Dash,
    Hls,
}

export class Player {
    private player: dashjs.MediaPlayerClass | HTMLVideoElement;
    private hlsPlayer: Hls | undefined;
    private source: string;
    public playerType: PlayerType;

    constructor(playerType: PlayerType, player: dashjs.MediaPlayerClass | HTMLVideoElement, source: string, hlsPlayer?: Hls) {
        this.playerType = playerType;
        this.player = player;
        this.source = source;
        this.hlsPlayer = playerType === PlayerType.Hls ? hlsPlayer : null;
    }

    destroy() {
        switch (this.playerType) {
            case PlayerType.Dash:
                try {
                    (this.player as dashjs.MediaPlayerClass).destroy();
                } catch (e) {
                    logger.warn("Failed to destroy dash player", e);
                }
                this.player = null;
                this.playerType = null;
                break;

            case PlayerType.Hls:
                // HLS also uses html player
                try {
                    this.hlsPlayer.destroy();
                } catch (e) {
                    logger.warn("Failed to destroy hls player", e);
                }
                // fall through

            case PlayerType.Html: {
                const videoPlayer = this.player as HTMLVideoElement;

                videoPlayer.src = "";
                // videoPlayer.onerror = null;
                videoPlayer.onloadedmetadata = null;
                videoPlayer.ontimeupdate = null;
                videoPlayer.onplay = null;
                videoPlayer.onpause = null;
                videoPlayer.onended = null;
                videoPlayer.ontimeupdate = null;
                videoPlayer.onratechange = null;
                videoPlayer.onvolumechange = null;

                this.player = null;
                this.playerType = null;
                break;
            }

            default:
                break;
        }
    }

    play() { logger.info("Player: play"); this.player.play(); }

    isPaused(): boolean {
        if (this.playerType === PlayerType.Dash) {
            return (this.player as dashjs.MediaPlayerClass).isPaused();
        } else { // HLS, HTML
            return (this.player as HTMLVideoElement).paused;
        }
    }
    pause() { logger.info("Player: pause"); this.player.pause(); }

    getVolume(): number {
        if (this.playerType === PlayerType.Dash) {
            return (this.player as dashjs.MediaPlayerClass).getVolume();
        } else { // HLS, HTML
            return (this.player as HTMLVideoElement).volume;
        }
    }
    setVolume(value: number) {
        logger.info(`Player: setVolume ${value}`);
        const sanitizedVolume = Math.min(1.0, Math.max(0.0, value));

        if (this.playerType === PlayerType.Dash) {
            (this.player as dashjs.MediaPlayerClass).setVolume(sanitizedVolume);
        } else { // HLS, HTML
            (this.player as HTMLVideoElement).volume = sanitizedVolume;
        }
    }

    isMuted(): boolean {
        if (this.playerType === PlayerType.Dash) {
            return (this.player as dashjs.MediaPlayerClass).isMuted();
        } else { // HLS, HTML
            return (this.player as HTMLVideoElement).muted;
        }
    }
    setMute(value: boolean) {
        logger.info(`Player: setMute ${value}`);

        if (this.playerType === PlayerType.Dash) {
            (this.player as dashjs.MediaPlayerClass).setMute(value);
        } else { // HLS, HTML
            (this.player as HTMLVideoElement).muted = value;
        }
    }

    getPlaybackRate(): number {
        if (this.playerType === PlayerType.Dash) {
            return (this.player as dashjs.MediaPlayerClass).getPlaybackRate();
        } else { // HLS, HTML
            return (this.player as HTMLVideoElement).playbackRate;
        }
    }
    setPlaybackRate(value: number) {
        logger.info(`Player: setPlaybackRate ${value}`);
        const sanitizedSpeed = Math.min(16.0, Math.max(0.0, value));

        if (this.playerType === PlayerType.Dash) {
            (this.player as dashjs.MediaPlayerClass).setPlaybackRate(sanitizedSpeed);
        } else { // HLS, HTML
            (this.player as HTMLVideoElement).playbackRate = sanitizedSpeed;
        }
    }

    getDuration(): number {
        if (this.playerType === PlayerType.Dash) {
            const videoPlayer = this.player as dashjs.MediaPlayerClass;
            return isFinite(videoPlayer.duration()) ? videoPlayer.duration() : 0;
        } else { // HLS, HTML
            const videoPlayer = this.player as HTMLVideoElement;
            return isFinite(videoPlayer.duration) ? videoPlayer.duration : 0;
        }
    }

    getCurrentTime(): number {
        if (this.playerType === PlayerType.Dash) {
            return (this.player as dashjs.MediaPlayerClass).time();
        } else { // HLS, HTML
            return (this.player as HTMLVideoElement).currentTime;
        }
    }
    setCurrentTime(value: number) {
        // logger.info(`Player: setCurrentTime ${value}`);
        const sanitizedTime = Math.min(this.getDuration(), Math.max(0.0, value));

        if (this.playerType === PlayerType.Dash) {
            (this.player as dashjs.MediaPlayerClass).seek(sanitizedTime);
            const videoPlayer = this.player as dashjs.MediaPlayerClass;

            if (!videoPlayer.isSeeking()) {
                videoPlayer.seek(sanitizedTime);
            }

        } else { // HLS, HTML
            (this.player as HTMLVideoElement).currentTime = sanitizedTime;
        }
    }

    getSource(): string {
        return this.source;
    }

    getBufferLength(): number {
        if (this.playerType === PlayerType.Dash) {
            const dashPlayer = this.player as dashjs.MediaPlayerClass;

            let dashBufferLength = dashPlayer.getBufferLength("video")
                ?? dashPlayer.getBufferLength("audio")
                ?? dashPlayer.getBufferLength("text")
                ?? dashPlayer.getBufferLength("image")
                ?? 0;
            if (Number.isNaN(dashBufferLength))
                dashBufferLength = 0;

            dashBufferLength += dashPlayer.time();
            return dashBufferLength;
        } else { // HLS, HTML
            const videoPlayer = this.player as HTMLVideoElement;
            let maxBuffer = 0;

            if (videoPlayer.buffered) {
                for (let i = 0; i < videoPlayer.buffered.length; i++) {
                    const start = videoPlayer.buffered.start(i);
                    const end = videoPlayer.buffered.end(i);

                    if (videoPlayer.currentTime >= start && videoPlayer.currentTime <= end) {
                        maxBuffer = end;
                    }
                }
            }

            return maxBuffer;
        }
    }

    isCaptionsSupported(): boolean {
        if (this.playerType === PlayerType.Dash) {
            return (this.player as dashjs.MediaPlayerClass).getTracksFor('text').length > 0;
        } else if (this.playerType === PlayerType.Hls) {
            return this.hlsPlayer.allSubtitleTracks.length > 0;
        } else {
            return false; // HTML captions not currently supported
        }
    }

    isCaptionsEnabled(): boolean {
        if (this.playerType === PlayerType.Dash) {
            return (this.player as dashjs.MediaPlayerClass).isTextEnabled();
        } else if (this.playerType === PlayerType.Hls) {
            return this.hlsPlayer.subtitleDisplay;
        } else {
            return false; // HTML captions not currently supported
        }
    }

    enableCaptions(enable: boolean) {
        if (this.playerType === PlayerType.Dash) {
            (this.player as dashjs.MediaPlayerClass).enableText(enable);
        } else if (this.playerType === PlayerType.Hls) {
            this.hlsPlayer.subtitleDisplay = enable;
        }
        // HTML captions not currently supported
    }

}

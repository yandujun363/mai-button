import { state } from '@core/state.js';
import { playRandomVoice, stopAllVoices } from '@core/audioPlayer.js';
import { cdnManager } from '@app/cdnManager.js';

export const eventBinder = {
    bindAll() {
        this.bindRandomPlay();
        this.bindStopAll();
        this.bindLoopMode();
        this.bindChangeCdn();
    },
    
    bindRandomPlay() {
        const btn = document.getElementById('randomPlay');
        if (btn) {
            btn.addEventListener('click', playRandomVoice);
        }
    },
    
    bindStopAll() {
        const btn = document.getElementById('stopAll');
        if (btn) {
            btn.addEventListener('click', stopAllVoices);
        }
    },
    
    bindLoopMode() {
        const checkbox = document.getElementById('loopMode');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                state.isLoopMode = e.target.checked;
            });
        }
    },
    
    bindChangeCdn() {
        const btn = document.getElementById('changeCdn');
        if (!btn) return;
        
        if (state.isLocalMode || state.isSingleCdnMode) {
            btn.style.display = 'none';
        } else {
            btn.addEventListener('click', () => cdnManager.showSelector());
        }
    }
};
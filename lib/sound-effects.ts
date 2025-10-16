/**
 * Sound Effects Utility
 * Generates audio tones for scan feedback (similar to Apple Face ID)
 */

class SoundEffects {
  private audioContext: AudioContext | null = null

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  /**
   * Play a success tone (similar to Apple Face ID success)
   * Two ascending tones: C5 (523Hz) -> E5 (659Hz)
   */
  playSuccessTone() {
    try {
      const ctx = this.getAudioContext()
      const now = ctx.currentTime

      // First tone (C5)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(523.25, now) // C5
      gain1.gain.setValueAtTime(0.3, now)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      
      osc1.start(now)
      osc1.stop(now + 0.15)

      // Second tone (E5) - slightly delayed
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(659.25, now + 0.08) // E5
      gain2.gain.setValueAtTime(0.3, now + 0.08)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
      
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      
      osc2.start(now + 0.08)
      osc2.stop(now + 0.25)
    } catch (error) {
      console.warn('Failed to play success tone:', error)
    }
  }

  /**
   * Play an error/duplicate tone (similar to Apple Face ID failure)
   * Three descending tones with slight vibrato
   */
  playErrorTone() {
    try {
      const ctx = this.getAudioContext()
      const now = ctx.currentTime

      // Create three short descending tones
      const frequencies = [400, 350, 300] // Descending frequencies
      
      frequencies.forEach((freq, index) => {
        const startTime = now + (index * 0.1)
        
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.25, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start(startTime)
        osc.stop(startTime + 0.12)
      })
    } catch (error) {
      console.warn('Failed to play error tone:', error)
    }
  }

  /**
   * Play a duplicate entry tone (warning sound)
   * Two identical mid-range tones
   */
  playDuplicateTone() {
    try {
      const ctx = this.getAudioContext()
      const now = ctx.currentTime

      // Two identical warning tones
      for (let i = 0; i < 2; i++) {
        const startTime = now + (i * 0.15)
        
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.type = 'square' // Square wave for more distinct sound
        osc.frequency.setValueAtTime(440, startTime) // A4
        gain.gain.setValueAtTime(0.2, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start(startTime)
        osc.stop(startTime + 0.1)
      }
    } catch (error) {
      console.warn('Failed to play duplicate tone:', error)
    }
  }
}

// Export singleton instance
export const soundEffects = new SoundEffects()
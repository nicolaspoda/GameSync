import penduFrame1 from '../../assets/pendu_frame1.jpg'
import penduFrame2 from '../../assets/pendu_frame2.jpg'
import penduFrame3 from '../../assets/pendu_frame3.jpg'
import penduFrame4 from '../../assets/pendu_frame4.jpg'
import penduFrame5 from '../../assets/pendu_frame5.jpg'

export const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
export const hangmanFrames = [
  penduFrame1,
  penduFrame2,
  penduFrame3,
  penduFrame4,
  penduFrame5,
] as const
export const maxErrors = hangmanFrames.length

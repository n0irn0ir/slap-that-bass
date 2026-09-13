import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { STRINGS, pluck } from '../lib/pluck'
import { Burst, Jelly } from './ui'
import { useT } from '../lib/i18n'

// Sobering, not soaring. Original lines; no gurus quoted.
const LINES_EN: string[] = [
  'Nobody is watching. Play the boring thing slowly.',
  'You don’t have to feel like it. You have to pick it up.',
  'Bad days count. Log ten minutes and go.',
  'You were worse a month ago. You didn’t notice then either.',
  'A wrong note played on time is a note. The right note not played is nothing.',
  'Most bass lines are roots. Most progress is too.',
  'Disappointment is not a plan. Twenty minutes is.',
  'You are allowed to be average today.',
  'The riff isn’t hard. It’s unfamiliar. Those are different problems.',
  'Slow is not a compromise. Slow is where the information is.',
  'Nobody good got there by feeling ready.',
  'Your hands know more than your mood does.',
  'One clean bar beats ten sloppy ones. Stop at one.',
  'The plateau is where the roots grow. Stay on it.',
  'Motivation shows up after you start, not before. It’s late, not absent.',
  'You don’t need a better bass. You need the same bass, more often.',
  'Comparison is a story. Minutes are data.',
  'If it hurts, stop. If it’s boring, that’s practice.',
  'Practice makes permanent. That’s all it promises.',
  'Play it wrong on purpose. Now you know where the edges are.',
  'The point of today is tomorrow being slightly easier.',
  'You already know how to be bad at this. That was the hard part.',
]

const LINES_RU: string[] = [
  'Никто не смотрит. Сыграй скучное медленно.',
  'Не обязательно хотеть. Обязательно взять в руки.',
  'Плохие дни считаются. Запиши десять минут и иди.',
  'Месяц назад было хуже. Ты и тогда не замечала.',
  'Не та нота вовремя — это нота. Та нота не сыграна — это ничто.',
  'Басовые линии — в основном тоники. Прогресс тоже.',
  'Разочарование — не план. Двадцать минут — план.',
  'Сегодня можно быть средней.',
  'Рифф не сложный. Он незнакомый. Это разные проблемы.',
  'Медленно — не компромисс. В медленном вся информация.',
  'Никто из хороших не чувствовал себя готовым.',
  'Руки знают больше, чем настроение.',
  'Один чистый такт лучше десяти грязных. Остановись на одном.',
  'На плато растут корни. Постой на нём.',
  'Мотивация приходит после начала, не до. Она опаздывает, а не отсутствует.',
  'Нужен не бас получше. Нужен тот же бас, но чаще.',
  'Сравнение — это история. Минуты — это данные.',
  'Если больно — стоп. Если скучно — это и есть практика.',
  'Практика делает постоянным. Больше она ничего не обещает.',
  'Сыграй неправильно нарочно. Теперь видно, где края.',
  'Смысл сегодня — чтобы завтра было чуть легче.',
  'Быть плохой в этом ты уже умеешь. Это была сложная часть.',
]

export function Pep() {
  const { t, lang } = useT()
  const LINES = lang === 'ru' ? LINES_RU : LINES_EN
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(() => Math.floor(Math.random() * LINES.length))
  const [burst, setBurst] = useState(0)

  const next = useCallback(() => {
    setI((n) => (n + 1 + Math.floor(Math.random() * (LINES.length - 1))) % LINES.length)
    setBurst(Date.now())
  }, [LINES.length])

  function show() {
    setOpen(true)
    setBurst(Date.now())
    pluck(STRINGS[0])
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    const far = Math.hypot(info.offset.x, info.offset.y) > 160
    const fast = Math.hypot(info.velocity.x, info.velocity.y) > 900
    if (far || fast) setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, next])

  return (
    <>
      <motion.button
        type="button"
        className="meh-btn"
        onClick={show}
        whileHover={{ rotate: 3, y: 2 }}
        whileTap={{ scale: 0.9, rotate: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 14 }}
      >
        <span className="face">(-_-)</span>
        {t('pep.button')}
      </motion.button>

      {createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            className="pep-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="pep has-burst"
              role="dialog"
              aria-label={t('pep.aria')}
              onClick={(e) => e.stopPropagation()}
              drag
              dragSnapToOrigin
              dragElastic={0.9}
              onDragEnd={onDragEnd}
              initial={{ x: -700, y: 500, rotate: -50, scale: 0.4, opacity: 0 }}
              animate={{ x: 0, y: 0, rotate: -2, scale: 1, opacity: 1 }}
              exit={{ x: 900, y: -500, rotate: 40, scale: 0.6, opacity: 0, transition: { duration: 0.35, ease: 'easeIn' } }}
              transition={{ type: 'spring', stiffness: 210, damping: 13, mass: 0.9 }}
              whileDrag={{ rotate: 4, scale: 1.02 }}
            >
              <Burst id={burst} n={16} />
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={i}
                  className="q"
                  initial={{ opacity: 0, y: 10, rotate: 1 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, y: -8, rotate: -1, transition: { duration: 0.12 } }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  {LINES[i]}
                </motion.p>
              </AnimatePresence>
              <div className="row">
                <div style={{ display: 'flex', gap: 8 }}>
                  <Jelly type="button" className="btn hot" onClick={next}>
                    {t('pep.another')}
                  </Jelly>
                  <Jelly type="button" className="btn ghost" onClick={() => setOpen(false)}>
                    {t('pep.fine')}
                  </Jelly>
                </div>
                <span className="hint">{t('pep.hint')}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </>
  )
}

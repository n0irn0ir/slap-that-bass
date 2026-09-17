import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CategoryId } from './types'

export type Lang = 'en' | 'ru'

const KEY = 'lang'

// ---------- dictionary ----------

const en = {
  // nav
  'nav.progress': 'Progress',
  'nav.topics': 'Topics',
  'nav.songs': 'Songs',
  'nav.journal': 'Journal',
  'nav.settings': 'Settings',
  'nav.local': 'local device',

  // login
  'login.brand': 'slap that bass',
  'login.greeting': 'Tune up. Log in.',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',

  // dashboard
  'dash.empty1': 'Nothing logged yet.',
  'dash.empty2': 'First session?',
  'dash.onTheBass': 'on the bass',
  'dash.across': 'across',
  'dash.session': 'session.',
  'dash.sessions': 'sessions.',
  'dash.logTime': 'New entry',
  'dash.dragHint': 'it also drags',
  'dash.bassAlt': 'Mustang bass in British Racing Green. Drag it around, or tap it.',
  'dash.last7': 'Last 7 days',
  'dash.topicsTouched': 'Topics touched',
  'dash.songsLearned': 'Songs learned',
  'dash.of': 'of',
  'dash.whereTime': 'Where the time goes',
  'dash.rhythm': 'Rhythm',
  'dash.rhythmHint': 'One dot per day, last 26 weeks. Bigger is longer.',
  'dash.weeks': 'Weeks',
  'dash.weeksHint': 'Minutes per week, last 12',
  'dash.mostPractised': 'Most practised',
  'dash.allTopics': 'All topics',
  'dash.stat.session': 'session',
  'dash.stat.sessions': 'sessions',

  // pep
  'pep.button': 'not feeling it',
  'pep.another': 'Another',
  'pep.fine': 'Fine, I’ll play',
  'pep.hint': 'drag to dismiss · space for next',
  'pep.aria': 'A sober word',

  // topics
  'topics.title': 'Topics',
  'topics.lead': 'A map of what there is to learn, not a checklist. A topic is never finished — only time goes into it. Rename, add or remove anything.',
  'topics.add': 'Add topic',
  'topics.category': 'Category',
  'topics.topic': 'Topic',
  'topics.placeholder': 'e.g. Ghost notes at 90 bpm',
  'topics.cancel': 'Cancel',
  'topics.addShort': 'Add',
  'topics.ofAll': '% of all time',
  'topics.addInline': 'Add a topic',
  'topics.log': 'log',
  'topics.rename': 'rename',
  'topics.remove': 'remove',
  'topics.removeConfirm': 'Remove "{title}"? Logged time stays, without a topic.',
  'topics.titleAria': 'Topic title',

  // songs
  'songs.title': 'Songs',
  'songs.lead': 'Pick without thinking: something to start, something to keep going, something to revisit.',
  'songs.artist': 'Artist',
  'songs.songTitle': 'Title',
  'songs.status': 'Status',
  'songs.slot': 'Slot',
  'songs.link': 'Link (optional)',
  'songs.linkPlaceholder': 'Spotify, video…',
  'songs.tab': 'Tab (optional)',
  'songs.tabPlaceholder': 'Songsterr, Ultimate Guitar…',
  'songs.tabShort': 'tab',
  'songs.add': 'Add',
  'songs.addSong': 'Add song',
  'songs.backlog': 'Backlog',
  'songs.backlogHint': 'Want to learn',
  'songs.learning': 'Learning',
  'songs.learningHint': 'Started',
  'songs.learned': 'Learned',
  'songs.learnedHint': 'Can play through',
  'songs.slotNone': 'No slot',
  'songs.slotEasy': 'Easy win',
  'songs.slotGrowth': 'Growth',
  'songs.slotDream': 'Dream',
  'songs.drop': 'Drop a song here',
  'songs.save': 'Save',
  'songs.cancel': 'Cancel',
  'songs.open': 'open',
  'songs.spotify': 'spotify',
  'songs.openSpotify': 'Open in Spotify',
  'songs.edit': 'edit',
  'songs.remove': 'remove',
  'songs.removeConfirm': 'Remove "{title}"?',

  // journal
  'journal.title': 'Journal',
  'journal.button': 'New entry',
  'journal.lead': 'Write it down after you put the bass back. Minutes, roughly. No timer.',
  'journal.new': 'New entry',
  'journal.editing': 'Editing an entry',
  'journal.defaultTitle': 'Daily practice',
  'journal.titleField': 'Title (optional)',
  'journal.date': 'Date',
  'journal.total': 'Total',
  'journal.min': 'min',
  'journal.h': 'h',
  'journal.hoursField': 'Hours',
  'journal.minutesField': 'Minutes',
  'journal.long': 'Long one. Stretch your hands.',
  'journal.lines': 'What I worked on',
  'journal.addLine': 'add a line',
  'journal.removeLine': 'remove line',
  'journal.linePlaceholder': 'Topic or song — or just the category',
  'journal.createTopic': 'New topic in {cat}: “{title}”',
  'journal.songs': 'Songs',
  'journal.split': 'Minutes you leave blank share the rest evenly.',
  'journal.overflow': 'Lines add up past the total — it will be saved as {n} min.',
  'journal.rating': 'How did it go? (optional)',
  'journal.ratingAria': 'Session rating',
  'journal.note': 'Note (optional)',
  'journal.notePlaceholder': 'What worked, what did not, what next',
  'journal.saveChanges': 'Save changes',
  'journal.add': 'Add entry',
  'journal.cancel': 'Cancel',
  'journal.empty': 'Nothing here yet. The first entry is the hardest.',
  'journal.edit': 'edit',
  'journal.delete': 'delete',
  'journal.deleteConfirm': 'Delete this entry?',
  'journal.hours': 'That’s {n} {hours} on the bass.',
  'topics.history': 'history',
  'history.never': 'Not in the journal yet.',
  'history.sum': '{time} across {n} {sessions}',
  'history.log': 'Log it now',
  'journal.search': 'Search entries',
  'journal.found': '{n} found',
  'journal.noMatch': 'Nothing matches.',
  'dash.p30': '30 days',
  'dash.p90': '90 days',
  'dash.pAll': 'All time',
  'notes.new': 'New note',
  'notes.pad': 'Sticky notes',
  'notes.pocket': 'Pocket',
  'notes.peel': 'Peel off',
  'notes.stick': 'stick',
  'notes.toss': 'toss',
  'notes.placeholder': 'Don’t forget…',
  'notes.blank': '(blank)',
  'cal.prev': 'previous month',
  'cal.next': 'next month',

  // settings
  'settings.title': 'Settings',
  'settings.account': 'Account',
  'settings.signOut': 'Sign out',
  'settings.localMode': 'Local mode — data stays in this browser',
  'settings.language': 'Language',
  'settings.avatar': 'Avatar — click to change',
  'settings.avatarRemove': 'Remove',
  'avatar.add': 'Add an avatar',
  'rank.level': 'Level',
  'rank.map': 'Ranks',
  'rank.next': 'next: {name} at {h} h',
  'rank.left': '{t} to go',
  'rank.up': 'New level',
  'rank.upSub': 'Somebody has to play the low notes. Apparently it’s you.',
  'rank.upOk': 'Nice',
  'avatar.change': 'Change avatar',
  'settings.data': 'Data',
  'settings.export': 'Export everything as JSON',
  'settings.counts': '{t} topics · {s} songs · {l} journal entries',
  'settings.exportBtn': 'Export',
  'settings.import': 'Import a JSON export (replaces current data)',
  'settings.importBtn': 'Import',
  'settings.importConfirm': 'Replace everything on this device with the file contents?',
  'settings.imported': 'Imported.',
  'settings.importFail': 'Could not import.',
  'settings.notExport': 'Not a slap that bass export.',
  'settings.restore': 'Restore sample topics',
  'settings.restoreHint': 'Adds back any of the topics from the brief you removed.',
  'settings.restoreBtn': 'Restore',
  'settings.restored': 'Added {n}.',
  'settings.nothingMissing': 'Nothing missing.',
  'settings.local': 'Local mode',
  'settings.sample': 'Load sample data',
  'settings.sampleHint': 'A month of made-up entries and placeholder songs, to see the pages filled in.',
  'settings.sampleConfirm': 'Replace current data with sample data?',
  'settings.load': 'Load',
  'settings.clear': 'Clear everything on this device',
  'settings.clearConfirm': 'Delete all local data? Sample topics will be re-added.',
  'settings.clearBtn': 'Clear',
  'settings.about': 'About',
  'settings.aboutText': 'The six categories and the sample topics come from the 26‑week brief. Nothing here is an assessment; logged minutes and self‑ratings are your own evidence.',

  // charts / rose
  'rose.least': 'least',
  'rose.note': 'The pulsing ring marks the category with the least time so far.',
  'rose.aria': 'Minutes per category',
  'chart.rest': 'rest',
  'chart.avg': 'avg',
  'chart.now': 'now',
  'chart.nothing': 'nothing',
  'chart.weekOf': 'week of',
  'chart.day': 'day',
  'chart.days': 'days',
  'chart.topEmpty': 'Log time against a topic and it shows up here.',
  'chart.rhythmAria': 'Minutes per day, last 26 weeks',
  'chart.weeksAria': 'Minutes per week, last 12 weeks',

  // categories
  'cat.technique.name': 'Technique',
  'cat.technique.short': 'Technique',
  'cat.technique.scope': 'Fingerstyle, muting, string crossing, articulation, speed and slap.',
  'cat.theory.name': 'Theory & Fretboard',
  'cat.theory.short': 'Theory',
  'cat.theory.scope': 'Notes, intervals, chord tones, scales and harmonic movement on the bass.',
  'cat.groove.name': 'Time & Groove',
  'cat.groove.short': 'Groove',
  'cat.groove.scope': 'Pulse, subdivisions, note lengths, rests, accents, syncopation and swing.',
  'cat.ear.name': 'Ear & Transcription',
  'cat.ear.short': 'Ear',
  'cat.ear.scope': 'Learn real bass parts by listening, singing and finding them on the instrument.',
  'cat.creativity.name': 'Creativity',
  'cat.creativity.short': 'Creativity',
  'cat.creativity.scope': 'Create grooves, variations, fills and walking bass lines.',
  'cat.fun.name': 'Fun & Repertoire',
  'cat.fun.short': 'Fun',
  'cat.fun.scope': 'Favourite riffs and songs, with tabs or tutorials allowed.',

  // rating faces
  'rate.1': 'rough',
  'rate.2': 'meh',
  'rate.3': 'okay',
  'rate.4': 'good',
  'rate.5': 'great',

  // dates / units
  'date.today': 'Today',
  'date.yesterday': 'Yesterday',
  'unit.h': 'h',
  'unit.m': 'm',
} as const

export type Key = keyof typeof en

const ru: Record<Key, string> = {
  'nav.progress': 'Прогресс',
  'nav.topics': 'Темы',
  'nav.songs': 'Песни',
  'nav.journal': 'Дневник',
  'nav.settings': 'Настройки',
  'nav.local': 'локально',

  'login.brand': 'slap that bass',
  'login.greeting': 'Настройся. Войди.',
  'login.email': 'Почта',
  'login.password': 'Пароль',
  'login.submit': 'Войти',

  'dash.empty1': 'Пока ничего не записано.',
  'dash.empty2': 'Первая сессия?',
  'dash.onTheBass': 'с басом',
  'dash.across': 'за',
  'dash.session': 'сессию.',
  'dash.sessions': 'сессий.',
  'dash.logTime': 'Записать',
  'dash.dragHint': 'его можно таскать',
  'dash.bassAlt': 'Бас Mustang цвета British Racing Green. Потаскай или ткни.',
  'dash.last7': 'Последние 7 дней',
  'dash.topicsTouched': 'Тем затронуто',
  'dash.songsLearned': 'Песен выучено',
  'dash.of': 'из',
  'dash.whereTime': 'Куда уходит время',
  'dash.rhythm': 'Ритм',
  'dash.rhythmHint': 'Точка — день, последние 26 недель. Крупнее — дольше.',
  'dash.weeks': 'Недели',
  'dash.weeksHint': 'Минуты по неделям, последние 12',
  'dash.mostPractised': 'Больше всего',
  'dash.allTopics': 'Все темы',
  'dash.stat.session': 'сессия',
  'dash.stat.sessions': 'сессий',

  'pep.button': 'нет настроения',
  'pep.another': 'Ещё',
  'pep.fine': 'Ладно, играю',
  'pep.hint': 'потяни, чтобы закрыть · пробел — следующая',
  'pep.aria': 'Трезвое слово',

  'topics.title': 'Темы',
  'topics.lead': 'Карта того, что есть выучить, а не чеклист. Тема не бывает пройдена — в неё только уходит время. Переименовывай, добавляй, удаляй.',
  'topics.add': 'Добавить тему',
  'topics.category': 'Категория',
  'topics.topic': 'Тема',
  'topics.placeholder': 'напр. Гост-ноты на 90 bpm',
  'topics.cancel': 'Отмена',
  'topics.addShort': 'Добавить',
  'topics.ofAll': '% всего времени',
  'topics.addInline': 'Добавить тему',
  'topics.log': 'записать',
  'topics.rename': 'переименовать',
  'topics.remove': 'удалить',
  'topics.removeConfirm': 'Удалить «{title}»? Записанное время останется, без темы.',
  'topics.titleAria': 'Название темы',

  'songs.title': 'Песни',
  'songs.lead': 'Выбирай не думая: что начать, что продолжить, что повторить.',
  'songs.artist': 'Исполнитель',
  'songs.songTitle': 'Название',
  'songs.status': 'Статус',
  'songs.slot': 'Слот',
  'songs.link': 'Ссылка (необязательно)',
  'songs.linkPlaceholder': 'Spotify, видео…',
  'songs.tab': 'Табы (необязательно)',
  'songs.tabPlaceholder': 'Songsterr, Ultimate Guitar…',
  'songs.tabShort': 'табы',
  'songs.add': 'Добавить',
  'songs.addSong': 'Добавить песню',
  'songs.backlog': 'Бэклог',
  'songs.backlogHint': 'Хочу выучить',
  'songs.learning': 'Учу',
  'songs.learningHint': 'В процессе',
  'songs.learned': 'Выучено',
  'songs.learnedHint': 'Играю целиком',
  'songs.slotNone': 'Без слота',
  'songs.slotEasy': 'Лёгкая',
  'songs.slotGrowth': 'Рост',
  'songs.slotDream': 'Мечта',
  'songs.drop': 'Перетащи песню сюда',
  'songs.save': 'Сохранить',
  'songs.cancel': 'Отмена',
  'songs.open': 'открыть',
  'songs.spotify': 'spotify',
  'songs.openSpotify': 'Открыть в Spotify',
  'songs.edit': 'править',
  'songs.remove': 'удалить',
  'songs.removeConfirm': 'Удалить «{title}»?',

  'journal.title': 'Дневник',
  'journal.button': 'Записать',
  'journal.lead': 'Запиши, когда отложишь бас. Минуты — примерно. Таймера нет.',
  'journal.new': 'Новая запись',
  'journal.editing': 'Правка записи',
  'journal.defaultTitle': 'Обычная практика',
  'journal.titleField': 'Заголовок (необязательно)',
  'journal.date': 'Дата',
  'journal.total': 'Всего',
  'journal.min': 'мин',
  'journal.h': 'ч',
  'journal.hoursField': 'Часы',
  'journal.minutesField': 'Минуты',
  'journal.long': 'Длинная. Разомни руки.',
  'journal.lines': 'Что разбирала',
  'journal.addLine': 'добавить строку',
  'journal.removeLine': 'убрать строку',
  'journal.linePlaceholder': 'Тема или песня — или только категория',
  'journal.createTopic': 'Новая тема в «{cat}»: «{title}»',
  'journal.songs': 'Песни',
  'journal.split': 'Пустые минуты делят остаток поровну.',
  'journal.overflow': 'Строки в сумме больше общего — сохранится {n} мин.',
  'journal.rating': 'Как прошло? (необязательно)',
  'journal.ratingAria': 'Оценка сессии',
  'journal.note': 'Заметка (необязательно)',
  'journal.notePlaceholder': 'Что получилось, что нет, что дальше',
  'journal.saveChanges': 'Сохранить',
  'journal.add': 'Добавить',
  'journal.cancel': 'Отмена',
  'journal.empty': 'Пока пусто. Первая запись — самая сложная.',
  'journal.edit': 'править',
  'journal.delete': 'удалить',
  'journal.deleteConfirm': 'Удалить запись?',
  'journal.hours': 'Уже {n} {hours} с басом.',
  'topics.history': 'история',
  'history.never': 'В дневнике пока не встречалась.',
  'history.sum': '{time} за {n} {sessions}',
  'history.log': 'Записать сейчас',
  'journal.search': 'Поиск по записям',
  'journal.found': 'найдено: {n}',
  'journal.noMatch': 'Ничего не нашлось.',
  'dash.p30': '30 дней',
  'dash.p90': '90 дней',
  'dash.pAll': 'Всё время',
  'notes.new': 'Новая заметка',
  'notes.pad': 'Стикеры',
  'notes.pocket': 'Карман',
  'notes.peel': 'Отклеить',
  'notes.stick': 'наклеить',
  'notes.toss': 'выбросить',
  'notes.placeholder': 'Не забыть…',
  'notes.blank': '(пусто)',
  'cal.prev': 'предыдущий месяц',
  'cal.next': 'следующий месяц',

  'settings.title': 'Настройки',
  'settings.account': 'Аккаунт',
  'settings.signOut': 'Выйти',
  'settings.localMode': 'Локальный режим — данные хранятся в этом браузере',
  'settings.language': 'Язык',
  'settings.avatar': 'Аватар — клик, чтобы поменять',
  'settings.avatarRemove': 'Убрать',
  'avatar.add': 'Добавить аватар',
  'rank.level': 'Уровень',
  'rank.map': 'Уровни',
  'rank.next': 'дальше: {name} на {h} ч',
  'rank.left': 'ещё {t}',
  'rank.up': 'Новый уровень',
  'rank.upSub': 'Кто-то должен играть низкие ноты. Похоже, это ты.',
  'rank.upOk': 'Ладно',
  'avatar.change': 'Сменить аватар',
  'settings.data': 'Данные',
  'settings.export': 'Экспортировать всё в JSON',
  'settings.counts': '{t} тем · {s} песен · {l} записей в дневнике',
  'settings.exportBtn': 'Экспорт',
  'settings.import': 'Импорт из JSON (заменит текущие данные)',
  'settings.importBtn': 'Импорт',
  'settings.importConfirm': 'Заменить все данные на этом устройстве содержимым файла?',
  'settings.imported': 'Импортировано.',
  'settings.importFail': 'Не удалось импортировать.',
  'settings.notExport': 'Это не экспорт slap that bass.',
  'settings.restore': 'Вернуть темы из образца',
  'settings.restoreHint': 'Добавит обратно удалённые темы из брифа.',
  'settings.restoreBtn': 'Вернуть',
  'settings.restored': 'Добавлено: {n}.',
  'settings.nothingMissing': 'Ничего не пропало.',
  'settings.local': 'Локальный режим',
  'settings.sample': 'Загрузить пример данных',
  'settings.sampleHint': 'Месяц выдуманных записей и песни-заглушки, чтобы увидеть страницы заполненными.',
  'settings.sampleConfirm': 'Заменить текущие данные примером?',
  'settings.load': 'Загрузить',
  'settings.clear': 'Стереть всё на этом устройстве',
  'settings.clearConfirm': 'Удалить все локальные данные? Темы из образца добавятся снова.',
  'settings.clearBtn': 'Стереть',
  'settings.about': 'О платформе',
  'settings.aboutText': 'Шесть категорий и темы-образцы взяты из 26‑недельного брифа. Здесь ничего не оценивается: записанные минуты и твои оценки — единственное свидетельство.',

  'rose.least': 'меньше всего',
  'rose.note': 'Пульсирующее кольцо — категория, в которую пока ушло меньше всего времени.',
  'rose.aria': 'Минуты по категориям',
  'chart.rest': 'отдых',
  'chart.avg': 'в среднем',
  'chart.now': 'сейчас',
  'chart.nothing': 'ничего',
  'chart.weekOf': 'неделя с',
  'chart.day': 'день',
  'chart.days': 'дн.',
  'chart.topEmpty': 'Записывай время на тему — она появится здесь.',
  'chart.rhythmAria': 'Минуты по дням, последние 26 недель',
  'chart.weeksAria': 'Минуты по неделям, последние 12 недель',

  'cat.technique.name': 'Техника',
  'cat.technique.short': 'Техника',
  'cat.technique.scope': 'Пальцевая игра, глушение, переходы между струнами, артикуляция, скорость и слэп.',
  'cat.theory.name': 'Теория и гриф',
  'cat.theory.short': 'Теория',
  'cat.theory.scope': 'Ноты, интервалы, тоны аккордов, гаммы и гармоническое движение на басу.',
  'cat.groove.name': 'Время и грув',
  'cat.groove.short': 'Грув',
  'cat.groove.scope': 'Пульс, доли, длительности, паузы, акценты, синкопы и свинг.',
  'cat.ear.name': 'Слух и снятие',
  'cat.ear.short': 'Слух',
  'cat.ear.scope': 'Снимать настоящие басовые партии: слушать, петь, находить на инструменте.',
  'cat.creativity.name': 'Творчество',
  'cat.creativity.short': 'Творчество',
  'cat.creativity.scope': 'Придумывать грувы, вариации, филлы и уокинг-линии.',
  'cat.fun.name': 'Удовольствие и репертуар',
  'cat.fun.short': 'Кайф',
  'cat.fun.scope': 'Любимые риффы и песни; табы и разборы разрешены.',

  'rate.1': 'тяжко',
  'rate.2': 'так себе',
  'rate.3': 'нормально',
  'rate.4': 'хорошо',
  'rate.5': 'отлично',

  'date.today': 'Сегодня',
  'date.yesterday': 'Вчера',
  'unit.h': 'ч',
  'unit.m': 'м',
}

const DICT: Record<Lang, Record<Key, string>> = { en, ru }

// ---------- module-level locale, so plain helpers (format.ts) can read it ----------

let current: Lang = readLang()

function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'ru' || v === 'en') return v
  } catch {
    /* no storage */
  }
  return 'en'
}

export function getLang(): Lang {
  return current
}

/** Translate outside React (format helpers). */
export function tr(key: Key, vars?: Record<string, string | number>): string {
  let s: string = DICT[current][key] ?? en[key]
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
  return s
}

/** Russian plural forms: [1, 2–4, 5+]. English: [one, other]. */
export function plural(n: number, en1: string, enN: string, ru1: string, ru2: string, ru5: string): string {
  if (current === 'en') return n === 1 ? en1 : enN
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return ru1
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return ru2
  return ru5
}

// ---------- React side ----------

interface I18n {
  lang: Lang
  setLang(l: Lang): void
  t(key: Key, vars?: Record<string, string | number>): string
}

const Ctx = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current)
  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang(l) {
        current = l
        try {
          localStorage.setItem(KEY, l)
        } catch {
          /* fine */
        }
        document.documentElement.lang = l
        setLangState(l)
      },
      t: (key, vars) => tr(key, vars),
    }),
    [lang],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useT(): I18n {
  const v = useContext(Ctx)
  if (!v) throw new Error('useT outside I18nProvider')
  return v
}

/** Localised name / short / scope for a category id. */
export function catText(id: CategoryId) {
  return {
    name: tr(`cat.${id}.name` as Key),
    short: tr(`cat.${id}.short` as Key),
    scope: tr(`cat.${id}.scope` as Key),
  }
}

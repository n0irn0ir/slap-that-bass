import { useRef, useState } from 'react'
import { Segmented } from '../components/ui'
import { buildDemo } from '../lib/demo'
import { useT, type Lang } from '../lib/i18n'
import type { Snapshot } from '../lib/types'
import { useAuth } from '../state/AuthContext'
import { useData } from '../state/DataContext'

export function Settings() {
  const { user, mode, signOut } = useAuth()
  const { topics, songs, log, restoreSampleTopics, importSnapshot } = useData()
  const { t, lang, setLang } = useT()
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function exportJSON() {
    const snap: Snapshot = { topics, songs, log }
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `slap-that-bass-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importJSON(file: File) {
    try {
      const snap = JSON.parse(await file.text()) as Snapshot
      if (!Array.isArray(snap.topics) || !Array.isArray(snap.songs) || !Array.isArray(snap.log))
        throw new Error(t('settings.notExport'))
      if (!confirm(t('settings.importConfirm'))) return
      await importSnapshot(snap)
      setMsg(t('settings.imported'))
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('settings.importFail'))
    }
  }

  return (
    <>
      <div className="page-head">
        <h1 className="display">{t('settings.title')}</h1>
      </div>

      <div className="settings">
        <section>
          <div className="label">{t('settings.account')}</div>
          <div className="row">
            <span>{user?.id === 'local' ? t('nav.local') : user?.email}</span>
            {mode === 'supabase' ? (
              <button className="btn ghost sm" onClick={signOut}>
                {t('settings.signOut')}
              </button>
            ) : (
              <span className="small muted">{t('settings.localMode')}</span>
            )}
          </div>
          <div className="row">
            <span>{t('settings.language')}</span>
            <Segmented<Lang>
              name="language"
              value={lang}
              options={[
                { value: 'en', label: 'EN' },
                { value: 'ru', label: 'RU' },
              ]}
              onChange={setLang}
            />
          </div>
        </section>

        <section>
          <div className="label">{t('settings.data')}</div>
          <div className="row">
            <span>
              {t('settings.export')}
              <div className="small muted">
                {t('settings.counts', { t: topics.length, s: songs.length, l: log.length })}
              </div>
            </span>
            <button className="btn ghost sm" onClick={exportJSON}>
              {t('settings.exportBtn')}
            </button>
          </div>
          {mode === 'local' && (
            <div className="row">
              <span>{t('settings.import')}</span>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) importJSON(f)
                  e.target.value = ''
                }}
              />
              <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>
                {t('settings.importBtn')}
              </button>
            </div>
          )}
          <div className="row">
            <span>
              {t('settings.restore')}
              <div className="small muted">{t('settings.restoreHint')}</div>
            </span>
            <button
              className="btn ghost sm"
              onClick={async () => {
                const n = await restoreSampleTopics()
                setMsg(n ? t('settings.restored', { n }) : t('settings.nothingMissing'))
              }}
            >
              {t('settings.restoreBtn')}
            </button>
          </div>
          {msg && <div className="small muted">{msg}</div>}
        </section>

        {mode === 'local' && (
          <section>
            <div className="label">{t('settings.local')}</div>
            <div className="row">
              <span>
                {t('settings.sample')}
                <div className="small muted">{t('settings.sampleHint')}</div>
              </span>
              <button
                className="btn ghost sm"
                onClick={() => {
                  if (confirm(t('settings.sampleConfirm'))) importSnapshot(buildDemo(topics))
                }}
              >
                {t('settings.load')}
              </button>
            </div>
            <div className="row">
              <span>{t('settings.clear')}</span>
              <button
                className="btn ghost sm"
                onClick={() => {
                  if (confirm(t('settings.clearConfirm'))) importSnapshot({ topics: [], songs: [], log: [] })
                }}
              >
                {t('settings.clearBtn')}
              </button>
            </div>
          </section>
        )}

        <section>
          <div className="label">{t('settings.about')}</div>
          <p className="small muted" style={{ margin: 0 }}>
            {t('settings.aboutText')}
          </p>
        </section>
      </div>
    </>
  )
}

'use client'
import { getEntries, getHabits } from '@/lib/dataLayer'

import { journalStore$ } from '@/lib/dataLayer'
import { observer, useObservable } from '@legendapp/state/react'

const TestComponent = () => {
    const journalEntries = getEntries()
  return (
    <div>
 {journalEntries.map((entry) => {
    return <div key={entry.id}>{entry.content}</div>
 })}
    </div>
  )
}

export default observer(TestComponent)



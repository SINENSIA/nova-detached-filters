import DetachedFilterCard from './components/DetachedFilterCard'
import DetachedFilter from './components/DetachedFilter'
import AttachedHiddenFilter from './components/AttachedHiddenFilter'

Nova.booting((app, store) => {
  app.component('nova-detached-filters-card', DetachedFilterCard)
  app.component('nova-detached-filter', DetachedFilter)
  app.component('nova-attached-hidden-filter', AttachedHiddenFilter)
})
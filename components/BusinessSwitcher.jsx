import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useAdminBusiness } from '@/context/AdminBusinessContext'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function BusinessSwitcher() {
  const { businessType, setBusinessContext } = useAdminBusiness()

  const businesses = [
    { id: 'all', name: 'All Businesses', color: 'bg-slate-500' },
    { id: 'electronics', name: 'Electronics', color: 'bg-blue-500' },
    { id: 'furniture', name: 'Furniture', color: 'bg-teal-500' },
    { id: 'solar', name: 'Solar', color: 'bg-amber-500' },
  ]

  const current = businesses.find(b => b.id === businessType) || businesses[0]

  return (
    <Menu as="div" className="relative ml-4">
      <div>
        <Menu.Button className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors">
          <span className={`h-2.5 w-2.5 rounded-full ${current.color}`} />
          <span>{current.name}</span>
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {businesses.map((item) => (
            <Menu.Item key={item.id}>
              {({ active }) => (
                <button
                  onClick={() => setBusinessContext(item.id)}
                  className={classNames(
                    active ? 'bg-gray-50' : '',
                    'flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700'
                  )}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className={businessType === item.id ? 'font-bold' : ''}>{item.name}</span>
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

import {Disclosure, Transition} from '@headlessui/react';

const ChevronIcon = ({
  open,
}: {
  open: boolean
}) =>
  <div
    title={open? 'Close' : 'Open'}
    className={`
    text-black
    dark:text-white
    grid
    ${open ? 'transform rotate-180' : ''}
  `}>
    <ion-icon name="chevron-down-circle" style={{'pointerEvents': 'none'}} size={'large'}/>
  </div>;

const MoreInformation = ({
  title,
  children,
}: {
  title?: string,
  children?: JSX.Element,
}) =>
  <Disclosure>
    {({open}) => (
      <>
        <Disclosure.Button className={`
            flex justify-between items-center
            p-3
            w-full
            x-4 font-medium text-left
            focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75
          `}>
          <span>{title}</span>
          <ChevronIcon open={open}/>
        </Disclosure.Button>
        <Transition
          show={open}
          enter="transition duration-50 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-25 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Disclosure.Panel
            className={`
              p-6 pt-0
              text-sm
            `}
          >
            {children}
          </Disclosure.Panel>
        </Transition>
      </>
    )}
  </Disclosure>;

export default MoreInformation;

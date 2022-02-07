import React from 'react';
import {Popover, Transition} from '@headlessui/react';
// import {useMachine} from '@xstate/react';
// import {createMachine} from 'xstate';

// const tooltipMachine = createMachine({
//   id: 'tooltip',
//   initial: 'hidden',
//   states: {
//     displayed,
//   },
// });

export const ToolTip = (args: {
  button?: React.ReactNode | string | JSX.Element;
  panel: React.ReactNode | string | JSX.Element;
  children?: React.ReactNode;
  className?: string;
}) => {
  // const [current, send] = useMachine(tooltipMachine);
  // const [isOpen, setIsOpen] = React.useReducer(
  //     (state: boolean, event: 'click' | 'onMouseEnter' | 'onMouseLeave' | 'none') => {
  //       switch ( event ) {
  //         case 'click':
  //           return true;
  //         case 'onMouseEnter':
  //           return true;
  //         case 'onMouseLeave':
  //           return false;
  //         default:
  //           return state;
  //       }
  //     }, false);
  const [isHover, setIsHover] = React.useState(false);
  return <Popover className={args.className}>
    {({open, close}) => (
      <>
        <Popover.Button
          onMouseOver={() => (open = true, setIsHover(true))}
          onMouseLeave={() => (isHover && close(), setIsHover(false))}
          onClick={() => (open ? open = true : open = false)}
        >{args?.button || args?.children || <ion-icon name="information-circle"/>}</Popover.Button>
        {open && (
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel static>
              {console.log('this is showin')}
              {args?.panel}
            </Popover.Panel>
          </Transition>)}
      </>
    )}
  </Popover>;
};

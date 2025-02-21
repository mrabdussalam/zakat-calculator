import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: 'w-48' | 'w-56' | 'w-64';
}

export function Dropdown({ 
  trigger, 
  items, 
  align = 'right',
  width = 'w-48' 
}: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as={Fragment}>{trigger}</Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items 
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-10 mt-2 ${width} origin-top-right rounded-lg bg-white shadow-xs ring-1 ring-black-alpha-5 focus:outline-none`}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <Menu.Item key={index}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`
                      ${active ? 'bg-gray-50 text-gray-900' : 'text-gray-500'}
                      ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      group flex w-full items-center px-4 py-2 text-sm
                    `}
                  >
                    {item.icon && (
                      <span className="mr-3 h-5 w-5">{item.icon}</span>
                    )}
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 
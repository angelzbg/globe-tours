import { PersonIcon, ShieldLockIcon, ShieldIcon } from '@primer/octicons-react';

export const loginFields = [
  {
    name: 'logon',
    el: 'input',
    type: 'text',
    placeholder: 'Logon name',
    value: '',
    validate: (value) => !!value.length,
    errorMsg: 'Field is required',
    highlight: ['WRONG_CREDENTIALS'],
    icon: PersonIcon,
  },
  {
    name: 'password',
    el: 'input',
    type: 'password',
    placeholder: 'Password',
    value: '',
    validate: (value) => !!value.length,
    errorMsg: 'Field is required',
    highlight: ['WRONG_CREDENTIALS'],
    icon: ShieldLockIcon,
  },
];

export const registerFields = [
  {
    name: 'logon',
    el: 'input',
    type: 'text',
    placeholder: 'Logon name',
    value: '',
    validate: (value) => value.length > 2,
    errorMsg: 'Must be at least 3 characters',
    highlight: ['LOGON_EXISTS'],
    icon: PersonIcon,
  },
  {
    name: 'password',
    el: 'input',
    type: 'password',
    placeholder: 'Password',
    value: '',
    validate: (value) => value.length > 4,
    errorMsg: 'Must be at least 5 characters',
    icon: ShieldLockIcon,
  },
  {
    name: 'repeatPassword',
    el: 'input',
    type: 'password',
    placeholder: 'Repeat password',
    value: '',
    validate: (value, observable) => {
      const password = observable.fields.find(({ name }) => name === 'password').value;
      return password === value && !!password;
    },
    errorMsg: "Passwords don't match",
    icon: ShieldIcon,
  },
];

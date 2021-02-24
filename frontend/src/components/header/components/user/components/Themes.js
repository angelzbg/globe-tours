import React, { useState } from 'react';
import { Link, withRouter } from 'react-router-dom';

import { observer } from 'mobx-react';
import { useStore } from '../../../../../store/store';

import { SunIcon, MoonIcon, ChevronLeftIcon } from '@primer/octicons-react';

import { setColorScheme } from '../../../../../utils/themes';

export default observer(({ setToggle }) => {
  const store = useStore();

  const themes = [
    { name: store.themes[0], icon: <SunIcon /> },
    { name: store.themes[1], icon: <MoonIcon /> },
  ];

  return (
    <div className="user-menu-pop">
      <div onMouseLeave={() => store.nextTheme(store.theme)}>
        {themes.map(({ name, icon }) => (
          <div
            key={`theme-${name}`}
            className="user-menu-item"
            onMouseEnter={() => setColorScheme(name)}
            onClick={() => {
              store.nextTheme(name);
              setToggle('main');
            }}
          >
            <div className={`user-menu-icon ${name}`}>{icon}</div> <div className="user-menu-title">{name} theme</div>
          </div>
        ))}
      </div>
      <div className="user-menu-separator" />
      <div className="user-menu-item" onClick={() => setToggle('main')}>
        <div className="user-menu-icon">
          <ChevronLeftIcon />
        </div>{' '}
        <div className="user-menu-title">Back</div>
      </div>
    </div>
  );
});
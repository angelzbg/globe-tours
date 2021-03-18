import React, { useEffect } from 'react';
import { observer } from 'mobx-react';
import { screwEvent } from '../../utils/utils';
import UserCard from './UserCard';
import ViewMoreCard from './ViewMoreCard';

export default observer(({ title, data, yearAgo, time, link }) => {
  useEffect(() => {
    const container = document.getElementById(`container-${title}`);
    const onwheel = (event) => {
      const scrollLeft = container.scrollLeft;
      container.scrollLeft += event.deltaY * 1;
      if (scrollLeft !== container.scrollLeft) {
        screwEvent(event);
      }
    };
    container.addEventListener('mousewheel', onwheel, { passive: false });
    return () => {
      container.removeEventListener('mosuewheel', onwheel, { passive: false });
    };
  }, [title]);

  return (
    <div className="horizontal-container-wrapper">
      <div className="wrapper-title">{title}</div>
      <div className="container-wrap">
        <div className="horizontal-container" id={`container-${title}`}>
          <div className="card-wrap">
            {data.map((item) => (
              <UserCard key={`${title}-${item._id}`} {...{ title, yearAgo, time, item }} />
            ))}
            {data.length && <ViewMoreCard {...{ type: data[0].type, link }} />}
          </div>
        </div>
      </div>
    </div>
  );
});

import React from 'react';
import { observer } from 'mobx-react';
import { StarFillIcon, StarIcon, LocationIcon } from '@primer/octicons-react';
import { Link } from 'react-router-dom';
import no_profile from '../../images/no_profile.png';
import { getTimeDifference } from '../../utils/utils';

export default observer(({ item, i, section, yearAgo, time }) => {
  const { _id, name, avatar, rating, votes, ratingRound, created, city } = item;
  return (
    <Link key={`dev-${i}`} to={`/profile/${_id}`} className="user-card" style={{ marginLeft: i % 4 !== 0 ? 8 : 0 }}>
      <img className="avatar" src={avatar ? `/avatars/${avatar}` : no_profile} alt={`${name}'s avatar`} />
      <div className="name">{name}</div>
      <div className="rating-wrap">
        <div className="rating">
          {rating.toFixed(2)} / {votes} votes
        </div>
        {new Array(5).fill(0).map((_, idx) => (
          <span key={`star-d-${_id}-${idx}-${i}-${section}`}>
            {(idx < ratingRound ? StarFillIcon : StarIcon)({ size: 'small' })}
          </span>
        ))}
      </div>
      <div className="location">
        <LocationIcon size="small" /> {city}
      </div>
      <div className="date">
        joined{' '}
        {yearAgo < created
          ? getTimeDifference(created, time)
          : new Date(created).toLocaleString('en-GB', { timeZone: 'UTC' }).substring(0, 10)}
      </div>
    </Link>
  );
});
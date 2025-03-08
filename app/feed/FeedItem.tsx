"use client";
import { useState } from "react";

interface FeedItemProps {
  event: dbEvent; 
  canBet: boolean; 
}

interface dbEvent {
  id: string;
  sport_key : string;
  sport_title : string;
  commence_time : string;
  completed : string;
  home_team : string;
  away_team : string;
  home_team_price: number;
  away_team_price: number;
  scores : string | null;
  last_updated : string | null;
}

function getLastName(name : string) {
  if(! name.includes(' ')) return name

  const lastName = name.substring(name.lastIndexOf(' ') + 1)

  if( lastName.length < 3) {
    if( name.split(' ').length >= 2 ) {
      const names = name.split(' ')
      if(names[names.length-1].toLocaleLowerCase() == 'jr')
        return names[names.length-2]  
      return names[names.length-2] + ' ' + names[names.length-1]
    }
  }

  return name.substring(name.lastIndexOf(' ') + 1).toUpperCase()
}

function getPriceClass(price : number) {
  if (price > 0) return 'green-main'
  else if (price < 0) return 'red-main'
  return 'hidden'
}

function getBetBtnClass(canBet : boolean) {
  if (canBet) {
    return 'bet-btn'
  }
  return 'hidden'
}

export default function FeedItem({ event, canBet }:FeedItemProps) {

  console.log(event)
  console.log(canBet)


  return (
        
    <li key={event.id} className="feed-item p-4 bg-gray-100 rounded shadow flex flex-col">
      <div className="flex items-center justify-between">
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', width:'100%'}}>
          <div className="fightCardTitle"> 
            <p> {getLastName(event.home_team)} </p>
            <p className={ getPriceClass(event.home_team_price) }> {event.home_team_price} </p>
          </div>
          <p className="fightCardTitle" style={{fontSize:'1.5rem'}} > VS. </p>
          <div className="fightCardTitle"> 
            <p> {getLastName(event.away_team)} </p>
            <p className={ getPriceClass(event.away_team_price) }> {event.away_team_price} </p>
          </div>
          <p> {event.home_team} vs. {event.away_team} </p>
          <p className="text-sm text-gray-600">
            Commence Time: {new Date(event.commence_time).toLocaleString()}
          </p>
          <button className={getBetBtnClass(canBet)}> Bet Now </button>
        </div>
      </div>
    </li>
  );
}

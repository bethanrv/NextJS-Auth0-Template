"use client";
import { useState } from "react";

interface Fight {
  id : number
  created_at: string,
  title: string,
  slug: string,
  date: string,
  location: string,
  status: string,
  scheduled_rounds: number,
  result_outcome: string | null,
  result_round: string | null,
  fighter_1_name: string,
  fighter_2_name: string,
  fighter_1_id: string | null,
  fighter_2_id: string | null,
  fighter_1_is_winner: string | null,
  fighter_2_is_winner: string | null,
  division_name: string | null,
  division_weight_lb: number,
  event_id: string,
  poster_image_url: string | null,
  fighter_1_full_name: string,
  fighter_2_full_name: string,
  fighter_1_img: string,
  fighter_2_img: string,
}

interface FeedItemProps {
  event: Fight; 
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
        
    <li key={event.id} className="feed-item bg-gray-100 rounded shadow flex flex-col"  style={{ 
      backgroundImage: `url('${event.poster_image_url}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      borderRadius: '10px',
      marginBottom: '1.5rem'
    }}>
      <div className="flex items-center justify-between" style={{backdropFilter:'blur(5px) brightness(60%) grayscale(50%)', borderRadius:'10px'}}>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', width:'100%'}}>
          
          <div style={{display: 'flex', justifyContent:'space-evenly', alignItems:'center', width:'100%'}}>
           
            <div style={{display: 'flex'}}>
              <div className="square-container">
                <img src={event.fighter_1_img} className="square-image" alt=""/>
              </div>
            </div>

            <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
              <div className="fightCardTitle" style={{marginTop:'1rem'}}> 
                <p> {event.fighter_1_name} </p>
                {/* <p className={ getPriceClass(event.home_team_price) }> {event.home_team_price} </p> */}
              </div>
              <p className="fightCardTitle" style={{fontSize:'1.5rem'}} > VS. </p>
              <div className="fightCardTitle"> 
                <p> {event.fighter_2_name} </p>
                {/* <p className={ getPriceClass(event.away_team_price) }> {event.away_team_price} </p> */}
              </div>
            </div>

            <div style={{display: 'flex'}}>
              <div className="square-container">
                <img src={event.fighter_2_img} className="square-image" alt=""/>
              </div>
            </div>

          </div>

          <p style={{textAlign:'center'}}> {event.title} </p>
          <p style={{textAlign:'center'}}> {event.location} </p>
          <p className="text-sm" style={{textAlign:'center', marginTop: '5px'}}>
            {new Date(event.date).toLocaleString()}
          </p>
          <button style={{marginBottom:'1rem'}} className={getBetBtnClass(canBet)}> Bet Now </button>
        </div>
      </div>
    </li>
  );

  return (
    <li key={event.id} className="feed-item bg-gray-100 rounded shadow flex flex-col">
      <img className="rounded" src={event.poster_image_url?event.poster_image_url:''}></img>
    </li>
  );
}

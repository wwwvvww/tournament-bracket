import "./App.scss"
import surnamesList from "./surnames.json"
import { createContext, useEffect, useRef, useState } from "react"
import { random } from "./utils/random"
import { PlayersBlock } from "./components/players-block/players-block"
import config from "./bracket-config.json"
const {minSize, maxSize, size} = config

interface Player {
    id?: string
    name?: string
    position?: number | null
    color?: number
}

interface Bracket {
    name?: string | null
    players?: Array<Player> | null
    children?: Array<Bracket> | null
}

interface Main {
    name?: string | null
    children?: Array<Bracket> | null
}

interface AppContextInterface {
    players?(dragPlayer: number, dropPlayer: number): void
}

export const HandlerPlayerContext = createContext<AppContextInterface | null>(null)

const createPlayer = (): Player => {
    const randomValue: number = random(1, 769)
    const id = `${randomValue}`
    const name: string = surnamesList.surnames[randomValue]
    return {
        id: id,
        name: name,
        position: null
    }
}


const shuffle = (players: Array<object>): Array<Player> => {
    const result: Array<Player> = [...players]
    for (let i = result.length - 1; i > 0; i--) {
        const j = random(0, i)
        const t = result[i]
        result[i] = result[j]
        result[j] = t
    }
    for(let i = 0; i < result.length; i++) {
        result[i].position = i
    }
    return result as Array<Player>
}

const battle = (players: Array<Player> | null | undefined): Array<Player> | null => {
    const result: Array<Player> = []
    if(!players) return null
    for (let i = 0; i < players.length; i++) {
        const pair = [players[i], players[i + 1]]
        if(!pair[1]) {
            result.push(pair[0])
        } else {
            result.push(pair[Math.floor(random(0, 2))])
        }
        if(players.length > 1) {
            i += 1
        }
    }
    return result
}

export const App: React.FC = () => {
    const refInputNumberOfPlayers = useRef<HTMLInputElement | null>(null)
    const [round, setRound] = useState<number | null>(null)
    const [prevBracket, setPrevBracket] = useState<Bracket | null>({
        name: null,
        players: [],
        children: []
    })
    const [players, setPlayers] = useState<Array<Player> | null>(null)
    const [bracket, setBracket] = useState<Main>({
        name: null,
        children: null
    })
    const [value, setValue] = useState<number | null>(null)
    const generatePlayers = (inputValue?: number | null) => {
        if (!inputValue) inputValue = size
        if (typeof(inputValue) === "number") {
            if (inputValue <= minSize) inputValue = minSize <= 0 ? 1 : minSize
            if (inputValue >= maxSize) inputValue = maxSize
        }

        const result: Array<Player> = []
        for (let i = 0; i < inputValue; i++) {
            let player = createPlayer()
            player.position = i
            player.color = i

            if(result.indexOf(player) > -1) {
                player = createPlayer()
            } else {
                result.push(player)
            }
        }
        setPlayers([...result])
    }


    const mixPlayers = (): void => {
        if(!players) return
        if(round && round > 1) return
        setPlayers(() => [...shuffle(players)])
    }


    const insertResult = (): void => {
        setBracket(prev => {
            const main: Bracket | null | undefined = prev?.children?.[0]
            let lastRound: Bracket | null | undefined = main
            let prevRound: Bracket | null | undefined = null

            while(typeof(lastRound) === "object") {
                prevRound = lastRound
                lastRound = lastRound?.children?.[0] || null

                setPrevBracket(prev => ({
                    ...prev,
                        name: prevRound?.name || null,
                        players: prevRound?.players || null,
                        children: prevRound?.children || null
                }))

                if (!lastRound) {
                    if (prevRound) {
                        for (const key of Object.keys(prevRound!)) {
                            if (key === "children") {
                                prevRound[key] = [{
                                    name: `round: ${round}`,
                                    players: !round ? battle(players) : battle(prevRound?.players),
                                    children: null
                                }]
                            }
                        }
                        break
                    }
                }
            }
            return prev
        })
    }

    useEffect(() => {
        generatePlayers()
    }, [])

    useEffect(() => {
        setBracket(prev => ({
            ...prev,
            name: "Tournament",
            children: [{
                name: "start place",
                players: players ? [...players] : null,
                children: null
            }]
        }))
        // console.log(players)
    }, [players])

    useEffect(() => {
        setRound(prev => prev ? prev + 1 : 1)
    }, [])

    useEffect(() => {
        if(prevBracket?.players && prevBracket.players.length > 2) {
            setRound(prev => prev ? prev + 1 : 1)
        }
    }, [prevBracket])

    useEffect(() => {
        if(round) {
            insertResult()
        }
    }, [round])

    useEffect(() => {
        setRound(null)
        generatePlayers(refInputNumberOfPlayers!.current!.valueAsNumber)
    }, [value])

    const handlerPlayersState = (dragPlayer: number, dropPlayer: number): void => {
        if(!players) return
        if(isNaN(dropPlayer)) return

        if (players.length > 0) {
            setPlayers((prev: Array<Player> | null): Array<Player> | null => {
                if(prev) {
                    const result = [...prev]
                    const temp = prev[dragPlayer]
                    result.splice(dragPlayer, 1, prev[dropPlayer])
                    result.splice(dropPlayer, 1, temp)
                    result[dragPlayer].position = dragPlayer
                    result[dropPlayer].position = dropPlayer
                    return result
                } else {
                    return null
                }
            })
        }
    }
    return (
        <div className="main">
            <input
                type="number"
                placeholder="Введите количество участников"
                min={2}
                max={64}
                ref={refInputNumberOfPlayers}
                onChange={() => {
                    const value = refInputNumberOfPlayers.current?.valueAsNumber
                    if(value) {
                        setValue(value)
                    }
                }}
            />
            <button
               onMouseDown={() => {
                   if(round) return
                   setRound(prev => prev ? prev + 1 : 1)
            }}
            >start</button>
            <button
                onMouseDown={() => mixPlayers()}
            >randomize</button>
            <HandlerPlayerContext.Provider value={{players: handlerPlayersState}}>
                <PlayersBlock bracket={bracket}/>
            </HandlerPlayerContext.Provider>
        </div>
    )
}
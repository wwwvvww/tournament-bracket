import "./players-block.scss"
import React, { useEffect, useRef, useState } from "react"
import { PlayersBracket } from "../players-bracket/players-bracket"

interface Player {
    id?: string
    name?: string
}

interface Pair {
    playerOne?: Player | null
    playerTwo?: Player | null
}

interface Bracket {
    name?: string | null
    players?: Array<Player> | null
    children?: Array<Bracket> | null
    pairs?: Array<Pair | null>
}

interface Main {
    bracket?: Bracket
}



interface Pos {
    x?: number
    y?: number
    scale?: number
    panning?: boolean
    start?: {startX?: number, startY?: number}
}

let constProps = {
    offsetTop: 0
}
export const PlayersBlock: React.FC<Main> = ({bracket}) => {
    const startBracket: Bracket | null = bracket?.children?.[0] || null
    const getBracketBlocks = () => {
        const result: Array<Bracket> | null = []
        let next: Bracket | null | undefined = startBracket
        let count = 0

        while(typeof(next) === "object") {
            const pairContainer: Array<Pair> = []
            if (next?.players) {
                for (let i = 0; i < next.players!.length; i++) {
                    if (i % 2 === 0) {
                        const pair: Pair = {
                            playerOne: next.players?.[i] || null,
                            playerTwo: next.players?.[i + 1] || null
                        }
                        pairContainer.push(pair)
                    }
                }
            }
            result.push({...next, pairs: pairContainer})
            next = next?.children?.[0]
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            count += 1
            if (!next) {
                break
            }
        }
        return result
    }



    const containerRef = useRef<HTMLInputElement | null>(null)
    const [pos, setPos] = useState<Pos>({
        x: 0,
        y: 0,
        scale: 1,
        start: {
            startX: 0,
            startY: 0
        }
    })
    let panning = false
    const drag = (e: React.MouseEvent): void => {
        if(e.button > 0) return
        const clickTarget = e.target as HTMLElement
        if(clickTarget.dataset.playerid) return
        panning = true

        const mainBlock = containerRef.current!
        const properties = mainBlock.getBoundingClientRect()

        if(constProps.offsetTop === 0) {
            constProps = {
                ...constProps,
                    offsetTop: properties.top
            }
        }

        // mouse coords witn shift left and top = 0, 0
        const shiftX = e.clientX - properties.left
        const shiftY = Math.floor(e.clientY - properties.top)

        let posX = e.pageX - shiftX
        let posY = e.pageY - shiftY

        setPos(prev => ({
            ...prev,
                    ...prev.start,
                        startX: posX,
                        startY: posY
        }))

        const move = (e: MouseEvent): void => {
            e.preventDefault()
            if (!panning) return
            posX = e.pageX - shiftX,
            posY = e.pageY - shiftY
            setPos(prev => ({
                ...prev,
                    x: posX,
                    y: posY - constProps.offsetTop
            }))
        }

        const drop = (): void => {
            panning = false,
            window.removeEventListener("mousemove", move)
            window.removeEventListener("mouseup", drop)
        }

        window.addEventListener("mousemove", move)
        window.addEventListener("mouseup", drop)
    }

    const sliderRef = useRef<HTMLInputElement | null>(null)
    const onScroll = (e: React.WheelEvent) => {
        const mainBlock = containerRef.current!
        const properties = mainBlock.getBoundingClientRect()
        if(constProps.offsetTop === 0) {
            constProps = {
                ...constProps,
                    offsetTop: properties.top
            }
        }

        const delta = e.deltaY * -0.001
        const newScale = pos.scale! + delta
        const ratio = 1 - newScale / pos.scale!
        const newX = pos.x! + (e.clientX - pos.x!) * ratio
        const newY = pos.y! + (e.clientY - pos.y! - containerRef.current!.offsetTop) * ratio

        if(newScale < 0.4) {
            return
        }else if(newScale > 5) {
            return
        }
        setPos(prev => ({
            ...prev,
                scale: newScale,
                x: newX,
                y: newY
        }))
        sliderRef.current!.valueAsNumber = newScale * 100
    }

    const sliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPos(prev => ({
            ...prev,
                scale: e.target.valueAsNumber / 100,
        }))
    }

    return (
        <div className="main-block-container">
            <input type="range" min="40" max="500" step="1"
                ref={sliderRef}
                className="block-slider"
                onChange={sliderChange}
            />
            <div className="block-container">
                <div
                    className="players-block"
                    ref={containerRef}
                    onWheelCapture={onScroll}
                    onMouseDown={drag}
                    style={{transformOrigin: "0 0", transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.scale})`}}
                >
                    {getBracketBlocks()?.map((round, index) => {
                        return <PlayersBracket
                            key={index}
                            block={containerRef.current}
                            round={round}
                            isFirst={index === 0 ? true : false}
                        />
                    })}
                </div>
            </div>

        </div>
    )
}

    // const coords = containerRef.current?.getBoundingClientRect()

    // const sliderChange = (e: React.ChangeEvent): void => {
    //     const container = containerRef.current
    //     if(!container) return
    //     const value = (e.target as HTMLInputElement).valueAsNumber / 100
    //     const coords = containerRef.current?.getBoundingClientRect()
    // }

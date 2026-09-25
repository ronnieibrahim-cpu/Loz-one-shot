; soundFrequencyTable, envelopeWaitTable and vibratoOffsetTable, copied verbatim
; from oracles-disasm code/audio.s (lines 1811-1929).
soundFrequencyTable:
	.dw $002d
	.dw $009d
	.dw $0108
	.dw $016c
	.dw $01cb
	.dw $0224
	.dw $0279
	.dw $02c8
	.dw $0313
	.dw $0358
	.dw $039b
	.dw $03db
	.dw $0416
	.dw $044f
	.dw $0484
	.dw $04b6
	.dw $04e5
	.dw $0512
	.dw $053c
	.dw $0564
	.dw $058a
	.dw $05ac
	.dw $05ce
	.dw $05ed
	.dw $060b
	.dw $0627
	.dw $0642
	.dw $065b
	.dw $0673
	.dw $0689
	.dw $069e
	.dw $06b2
	.dw $06c5
	.dw $06d6
	.dw $06e7
	.dw $06f7
	.dw $0706
	.dw $0714
	.dw $0721
	.dw $072e
	.dw $0739
	.dw $0745
	.dw $074f
	.dw $0759
	.dw $0762
	.dw $076b
	.dw $0773
	.dw $077b
	.dw $0783
	.dw $078a
	.dw $0790
	.dw $0797
	.dw $079d
	.dw $07a2
	.dw $07a8
	.dw $07ad
	.dw $07b1
	.dw $07b6
	.dw $07ba
	.dw $07be
	.dw $07c1
	.dw $07c5
	.dw $07c8
	.dw $07cb
	.dw $07ce
	.dw $07d1
	.dw $07d4
	.dw $07d6
	.dw $07d9
	.dw $07db
	.dw $07dd
	.dw $07df
	.dw $07e1
	.dw $07e2
	.dw $07e4
	.dw $07e6
	.dw $07e7
	.dw $07e9
	.dw $07ea
	.dw $07eb
	.dw $07ec
	.dw $07ed
	.dw $07ee
	.dw $07ef
	.dw $07f0
	.dw $07f1
	.dw $07f2

; The number of audio ticks (close to the number of frames) until the envelope reaches volume V when it
; starts from 1 and has sweep pace S can be approximated with the formula (V-1)*S*8192/(137+1/7)/64
; (8192 is the timer frequency, 137 the number of timer ticks between timer interrupts, the timer is
; decremented once every 7th timer interrupt, and 64 is the envelope tick frequency). The table does fit
; this formula with V as the row index and S as the column index (with rounding to the nearest integer),
; but strangely, in the way it is indexed, it is offset by two rows. For example, the second row is indexed by
; a target volume of 1 (the same as the starting volume), so you would expect no wait, but the game using the
; second row of the table causes it to wait until the volume reaches level 3 and then jump back to volume 1.
; Should not be used with volume $e or $f or the table is indexed out of bounds
envelopeWaitTable:
	.db $00 $01 $02 $03 $04 $05 $06 $07
	.db $00 $02 $04 $06 $07 $09 $0b $0d
	.db $00 $03 $06 $08 $0b $0e $11 $14
	.db $00 $04 $07 $0b $0f $13 $16 $1a
	.db $00 $05 $09 $0e $13 $17 $1c $21
	.db $00 $06 $0b $11 $16 $1c $22 $27
	.db $00 $07 $0d $14 $1a $21 $27 $2e
	.db $00 $07 $0f $16 $1e $25 $2d $34
	.db $00 $08 $11 $19 $22 $2a $32 $3b
	.db $00 $09 $13 $1c $25 $2f $38 $41
	.db $00 $0a $15 $1f $29 $33 $3e $48
	.db $00 $0b $16 $22 $2d $38 $43 $4e
	.db $00 $0c $18 $24 $31 $3d $49 $55
	.db $00 $0d $1a $27 $34 $41 $4e $5b

; Frequency offsets that get added to the current played sound when vibrato is active
vibratoOffsetTable:
	.dw 0,1,2,1,0,-1,-2,-1

;;

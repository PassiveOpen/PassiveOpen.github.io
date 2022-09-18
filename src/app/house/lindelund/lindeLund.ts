import { House, HouseUser, xy } from '../house.model';
import { Room } from '../../model/specific/room.model';
import {
  CornerType,
  Wall,
  WallSide,
  WallType,
} from '../../model/specific/wall.model';
import { Door } from 'src/app/model/specific/door.model';
import { CableType, Floor, SensorType } from '../../components/enum.data';
import {
  angleBetween,
  angleXY,
  getDiagonal,
  mixPoints,
  offset,
  round,
} from '../../shared/global-functions';
import { Window, WindowForm } from '../../model/specific/window.model';
import { Sensor } from '../../model/specific/sensor.model';
import { lindeLundUpstairs } from './lindeLund.upstairs';
import { Footprint } from 'src/app/model/specific/footprint';

export const lindeLund: HouseUser = {
  studAmount: 10,
  studDistance: 0.61,
  towerWidth: 1,
  wallInnerThickness: 0.2,
  wallOuterThickness: 0.4,
  roof70DegOffset: 1,
  studAmountNorth: 14,
  studAmountSouth: 2,
  studAmountWest: 12,
  studAmountEast: 6,
  showTower: true,
  balconyWidth: 1.2,
  name: 'Lindelund',

  orientation: {
    lat: 52,
    log: 5.2,
    rotation: 180,
  },
  parts: [
    new Footprint({
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const s = house.stramien;
        const t = house.tower;

        this.coords = [
          [s.in.we.b, s.in.ns.b],
          [s.in.we.b, s.in.ns.a],
          [s.in.we.c, s.in.ns.a],
          [s.in.we.c, t.innerCoords[0][1]],
          t.innerCoords[0],
          t.innerCoords[1],
          t.innerCoords[2],
          t.innerCoords[3],
          [t.innerCoords[3][0], s.in.ns.b],
          // [s.in.we.c, s.in.ns.b],
          [s.in.we.d, s.in.ns.b],
          [s.in.we.d, s.in.ns.c],
          [s.in.we.c, s.in.ns.c],
          [s.in.we.c, s.in.ns.d],
          [s.in.we.b, s.in.ns.d],
          [s.in.we.b, s.in.ns.c],
          [s.in.we.a, s.in.ns.c],
          [s.in.we.a, s.in.ns.b],
        ];
      },
      parts: [
        ...[...Array(17).keys()]
          .map((i, index, arr) => {
            const towerCorners = [3, 4, 5, 6, 7];
            const gables = [1]; // todo

            if ([3, 4, 5, 6, 7].includes(i)) return;
            const innerCorners = [0, 11, 14, 17];

            const l = arr.length;
            return new Wall({
              type: WallType.outer,
              floor: Floor.all,
              onUpdate: function (this: Wall, house: House) {
                const getCorner = (i) => {
                  if (i === towerCorners[0] || i === towerCorners[4] + 1)
                    return CornerType.inside;

                  if (innerCorners.includes(i)) return CornerType.inside;
                  if (!innerCorners.includes(i)) return CornerType.outside;
                };

                this.drawByRoom(
                  i,
                  i + 1 !== l ? i + 1 : 0,
                  house,
                  getCorner(i),
                  getCorner(i + 1)
                );
              },
              parts: [
                ...(i === 16 // West-Wing-North-Wall
                  ? [1, 2].map(
                      (x) =>
                        new Window({
                          rotate: 90,
                          width: 0.6,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.origin = wall.getPosition(
                              WallSide.out,
                              x / 3,
                              this.width / 2
                            );
                          },
                        })
                    )
                  : []),

                ...(i === 15 // West-wing-West-wall
                  ? [
                      new Window({
                        windowForm: WindowForm.hexagon,
                        floor: Floor.top,
                        rotate: 0,
                        width: 1,
                        onUpdate: function (this: Window, house: House) {
                          const wall = this.parent;
                          this.origin = wall.getPosition(
                            WallSide.out,
                            1 / 2,
                            this.width / 2
                          );
                        },
                      }),
                      ...[1, 2].map(
                        (x) =>
                          new Window({
                            rotate: 0,
                            width: 0.9,
                            onUpdate: function (this: Window, house: House) {
                              const wall = this.parent;
                              this.origin = wall.getPosition(
                                WallSide.out,
                                x / 3,
                                this.width / 2
                              );
                            },
                          })
                      ),
                    ]
                  : []),
                ...(i === 14 // West-Wing-South-Wall
                  ? [1, 2].map(
                      (x) =>
                        new Window({
                          rotate: -90,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;

                            if (wall.innerWallLength < 5) {
                              this.width = wall.innerWallLength / 3 - 0.2;
                            } else {
                              this.width = 1.4;
                            }
                            this.origin = wall.getPosition(
                              WallSide.out,
                              x / 3,
                              this.width / 2
                            );
                          },
                        })
                    )
                  : []),

                ...(i === 12 // South-glass-facade-South-Wall
                  ? [1].map(
                      (x) =>
                        new Window({
                          rotate: -90,
                          floor: Floor.all,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            (this.width = wall.innerWallLength),
                              (this.origin = wall.getPosition(
                                WallSide.out,
                                x / 2,
                                this.width / 2
                              ));
                          },
                        })
                    )
                  : []),
                ...(i === 10 // East-Wing-South-Wall
                  ? [1].map(
                      (x) =>
                        new Window({
                          rotate: -90,
                          width: 1.4,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.origin = wall.getPosition(
                              WallSide.out,
                              x / 2,
                              this.width / 2
                            );
                          },
                        })
                    )
                  : []),
                ...(i === 9 // East-Wing-East-Wall
                  ? [
                      new Window({
                        windowForm: WindowForm.hexagon,
                        floor: Floor.top,
                        rotate: 180,
                        width: 1,
                        onUpdate: function (this: Window, house: House) {
                          const wall = this.parent;
                          this.origin = wall.getPosition(
                            WallSide.out,
                            1 / 2,
                            this.width / 2
                          );
                        },
                      }),
                      ...[0, 1].map(
                        (x) =>
                          new Window({
                            rotate: 180,
                            width: 0.8,
                            onUpdate: function (this: Window, house: House) {
                              const wall = this.parent;
                              this.origin = wall.getPosition(
                                WallSide.out,
                                x,
                                this.width / 2 +
                                  (this.width + 0.8) * (x === 0 ? 1 : -1)
                              );
                            },
                          })
                      ),
                    ]
                  : []),
                ...(i === 8 // East-Wing-North-Wall
                  ? [1].map(
                      (x) =>
                        new Window({
                          rotate: 90,
                          width: 0.6,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.origin = wall.getPosition(
                              WallSide.out,
                              1 / 2,
                              this.width / 2 - house.wallOuterThickness / 2
                            );
                          },
                        })
                    )
                  : []),

                ...(i === 2 // North-East-west-wall
                  ? [1, 2.5].map(
                      (x) =>
                        new Window({
                          rotate: 180,
                          width: 0.9,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.origin = wall.getPosition(
                              WallSide.out,
                              x / 3,
                              this.width / 2
                            );
                          },
                        })
                    )
                  : []),
                ...(i === 1 // North-wing-North-wall
                  ? [
                      new Window({
                        windowForm: WindowForm.hexagon,
                        floor: Floor.top,
                        rotate: 90,
                        width: 1,
                        onUpdate: function (this: Window, house: House) {
                          const wall = this.parent;
                          this.origin = wall.getPosition(
                            WallSide.out,
                            1 / 2,
                            this.width / 2
                          );
                        },
                      }),
                      ...[1, 2].map(
                        (x) =>
                          new Window({
                            rotate: 90,
                            width: 0.9,
                            onUpdate: function (this: Window, house: House) {
                              const wall = this.parent;
                              this.origin = wall.getPosition(
                                WallSide.out,
                                x / 3,
                                this.width / 2
                              );
                            },
                          })
                      ),
                    ]
                  : []),
                ...(i === 0 // North-wing-west-wall
                  ? [
                      new Door({
                        outside: true,
                        rotate: 0,
                        scale: [1, 1],
                        onUpdate: function (this: Door, house: House) {
                          this.origin = offset(
                            this.parent.getPosition(
                              WallSide.in,
                              0,
                              1.2 + house.wallInnerThickness
                            ),
                            [-house.wallOuterThickness, 0]
                          );
                        },
                      }),
                      ...[2, 5].map(
                        (x) =>
                          new Window({
                            rotate: 0,
                            width: 0.9,
                            onUpdate: function (this: Window, house: House) {
                              const wall = this.parent;
                              this.origin = wall.getPosition(
                                WallSide.out,
                                (x + 1) / 8,
                                this.width / 2
                              );
                            },
                          })
                      ),
                    ]
                  : []),
              ],
            });
          })
          .filter((x) => x),

        // North
        new Wall({
          type: WallType.outer,
          floor: Floor.all,
          onUpdate: function (this: Wall, house: House) {
            this.ceiling = house.cross.ceilingHeight;
            this.outOfDesign = !house.showTower;
            if (this.outOfDesign) return;

            const wallDiff =
              house.wallOuterThickness - house.wallInnerThickness;

            this.origin = [
              house.stramien.in.we.c,
              house.tower.innerCoords[0][1],
            ];
            this.innerWallLength = house.towerWidth - wallDiff;
            this.sides = {
              [WallSide.out]: [
                house.tower.outerCoords[0],
                house.tower.outerCoords[1],
              ],
              [WallSide.in]: [
                [house.stramien.in.we.c, house.tower.innerCoords[0][1]],
                house.tower.innerCoords[1],
              ],
            };
          },
        }),
        // NOrthWest
        new Wall({
          type: WallType.outer,
          floor: Floor.all,
          onUpdate: function (this: Wall, house: House) {
            this.ceiling = house.cross.ceilingHeight;
            this.outOfDesign = !house.showTower;
            if (this.outOfDesign) return;

            const room = this.parent;
            this.origin = house.tower.innerCoords[1];

            this.sides = {
              [WallSide.out]: [
                house.tower.outerCoords[1],
                house.tower.outerCoords[2],
              ],
              [WallSide.in]: [
                house.tower.innerCoords[1],
                house.tower.innerCoords[2],
              ],
            };
          },
          parts: [
            new Door({
              outside: true,
              rotate: 45 + 90,
              scale: [1, 1],
              floor: Floor.ground,
              onUpdate: function (this: Door, house: House) {
                this.outOfDesign = !house.showTower;
                if (this.outOfDesign) return;
                const side = WallSide.out;
                const wall = this.parent;
                this.origin = wall.getPosition(side, 1 / 2, -this.width / 2);
              },
            }),
          ],
        }),
        // East
        new Wall({
          type: WallType.outer,
          floor: Floor.all,
          onUpdate: function (this: Wall, house: House) {
            this.ceiling = house.cross.ceilingHeight;
            this.outOfDesign = !house.showTower;
            if (this.outOfDesign) return;

            const room = this.parent;
            this.origin = house.tower.innerCoords[2];
            this.sides = {
              [WallSide.out]: [
                house.tower.outerCoords[2],
                house.tower.outerCoords[3],
              ],
              [WallSide.in]: [
                house.tower.innerCoords[2],
                [house.tower.innerCoords[3][0], house.stramien.in.ns.b],
              ],
            };
          },
          parts: [],
        }),
      ],
    }),

    // West / Left
    new Room({
      name: 'West',
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const s = house.stramien;
        this.northWestCorner = [s.in.we.a, s.in.ns.b];
        this.squaredRoom(
          s.in.we.b - s.in.we.a - house.wallInnerThickness,
          s.in.ns.c - s.in.ns.b
        );
      },
      parts: [
        // North
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('n', house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              offset: [0, 0.3],
              sensorType: SensorType.ethernet,
              onUpdate: function (this: Sensor<Wall>) {
                const techRoom = this.parent.parent.parent.serverRoom;
                const point = this.parent.getPosition(WallSide.in, 3 / 4, 0);
                this.points = [
                  point,
                  mixPoints(techRoom, point, false),
                  techRoom,
                ];
              },
            }),
            new Sensor<Wall>({
              offset: [0, 0.3],
              sensorType: SensorType.ethernet,
              onUpdate: function (this: Sensor<Wall>) {
                const techRoom = this.parent.parent.parent.serverRoom;
                const point = this.parent.getPosition(WallSide.in, 1 / 4, 0);
                this.points = [
                  point,
                  mixPoints(techRoom, point, false),
                  techRoom,
                ];
              },
            }),
            new Sensor({
              group: 1,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, 0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(
                  this.parent.sides[WallSide.in][1],
                  [-1, 0]
                );
                this.points = [point];
              },
            }),
            new Sensor({
              group: 1,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, 0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const dist = this.parent.parent.width / 2;
                const point = offset(this.parent.sides[WallSide.in][1], [
                  -dist,
                  0,
                ]);
                this.points = [point];
              },
            }),
            new Sensor({
              group: 1,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, 0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(this.parent.sides[WallSide.in][0], [1, 0]);
                this.points = [point];
              },
            }),
          ],
        }),
        // East
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              1,
              2,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            new Sensor({
              group: 2,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [-0.3, 0], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(
                  this.parent.sides[WallSide.in][1],
                  [0, -1]
                );
                this.points = [point];
              },
            }),
            new Sensor({
              group: 1,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [-0.3, 0], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(this.parent.sides[WallSide.in][0], [0, 1]);
                this.points = [point];
              },
            }),
            new Door({
              scale: [1, -1],
              onUpdate: function (this: Door, house: House) {
                const side = WallSide.in;
                const wallMid = this.parent.parent.height / 2;
                this.origin = offset(this.parent.sides[side][0], [
                  0,
                  wallMid - this.width,
                ]);
              },
            }),
            new Door({
              scale: [1, 1],
              onUpdate: function (this: Door, house: House) {
                const side = WallSide.in;
                const wallMid = this.parent.parent.height / 2;
                this.origin = offset(this.parent.sides[side][0], [
                  0,
                  wallMid + this.width,
                ]);
              },
            }),

            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 0, 1.5);
                this.points = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),
        // South
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('s', house, house.wallOuterThickness);
          },
          parts: [
            new Sensor({
              group: 2,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, -0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(
                  this.parent.sides[WallSide.in][0],
                  [-1, 0]
                );
                this.points = [point];
              },
            }),
            new Sensor({
              group: 2,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, -0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const dist = this.parent.parent.width / 2;
                const point = offset(this.parent.sides[WallSide.in][0], [
                  -dist,
                  0,
                ]);
                this.points = [point];
              },
            }),
            new Sensor({
              group: 2,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, -0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(this.parent.sides[WallSide.in][1], [1, 0]);
                this.points = [point];
              },
            }),
          ],
        }),
        // West
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('w', house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              group: 1,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0.3, 0], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(this.parent.sides[WallSide.in][1], [0, 1]);
                this.points = [point];
              },
            }),
            new Sensor<Wall>({
              group: 2,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0.3, 0], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(
                  this.parent.sides[WallSide.in][0],
                  [0, -1]
                );
                this.points = [point];
              },
            }),
          ],
        }),

        new Sensor<Room>({
          sensorType: SensorType.smoke,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 0.8,
              this.parent.height * 0.5,
            ]);
            const point2 = offset(point1, [0, -this.parent.height * 0.5]);

            this.points = [
              point1,
              point2,
              mixPoints(point2, house.serverRoom, false),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 1,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            this.points = [
              offset(room.northWestCorner, [
                room.width - room.parent.wallInnerThickness,
                room.height / 2 - 1,
              ]),
              offset(room.northWestCorner, [
                room.width - room.parent.wallInnerThickness,
                0,
              ]),
              offset(room.northWestCorner, [0, 0]),
              offset(room.northWestCorner, [0, room.height / 2 - 1]),
            ];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 2,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            this.points = [
              offset(room.northWestCorner, [0, room.height / 2 + 1]),
              offset(room.northWestCorner, [0, room.height]),
              offset(room.northWestCorner, [
                room.width - room.parent.wallInnerThickness,
                room.height,
              ]),
              offset(room.northWestCorner, [
                room.width - room.parent.wallInnerThickness,
                room.height / 2 + 1,
              ]),
            ];
          },
        }),
        new Sensor<Room>({
          group: 1,
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          classes: ['cable-connection'],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [
              room.width - house.wallInnerThickness,
              0,
            ]);
            this.points = [
              point,
              mixPoints(house.serverRoom, point, true),
              house.serverRoom,
            ];
          },
        }),

        new Sensor<Room>({
          group: 2,
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          classes: ['cable-connection'],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [
              room.width,
              room.height / 2 + 1,
            ]);
            this.points = [
              offset(room.northWestCorner, [
                room.width - house.wallInnerThickness,
                room.height / 2 + 1,
              ]),
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),

        ...[SensorType.camera, SensorType.poe].map(
          (sensorType) =>
            new Sensor<Room>({
              sensorType,
              cableType: CableType.OutsidePOE,
              offset: [0, -1],
              onUpdate: function (this: Sensor<Room>, house: House) {
                const room = this.parent;
                const point = offset(room.northWestCorner, [
                  room.width / 2,
                  -house.wallOuterThickness,
                ]);
                this.points = [point, offset(point, [0, 1]), house.serverRoom];
              },
            })
        ),

        ...[SensorType.camera, SensorType.poe].map(
          (sensorType) =>
            new Sensor<Room>({
              sensorType,
              cableType: CableType.OutsidePOE,
              offset: [0, 1],
              onUpdate: function (this: Sensor<Room>, house: House) {
                const room = this.parent;
                const point = offset(room.northWestCorner, [
                  1,
                  room.height + house.wallOuterThickness,
                ]);
                this.points = [point, offset(point, [0, -1]), house.serverRoom];
              },
            })
        ),
      ],
    }),
    // East / Right
    new Room({
      name: 'East',
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const s = house.stramien;
        this.northWestCorner = [
          s.in.we.c + house.wallInnerThickness,
          s.in.ns.b,
        ];
        this.squaredRoom(
          s.in.we.d - s.in.we.c - house.wallInnerThickness,
          s.in.ns.c - s.in.ns.b
        );
      },
      parts: [
        // North
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('n', house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              sensorType: SensorType.dimmer,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 1 / 3, 0);

                this.points = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
            new Sensor<Wall>({
              group: 3,
              sensorType: SensorType.socket,
              amount: 2,
              onUpdate: function (this: Sensor<Wall>) {
                this.points = [this.parent.getPosition(WallSide.in, 1 / 3, 0)];
              },
            }),
            new Sensor<Wall>({
              group: 3,
              sensorType: SensorType.socket,
              amount: 2,
              onUpdate: function (this: Sensor<Wall>) {
                this.points = [this.parent.getPosition(WallSide.in, 2 / 3, 0)];
              },
            }),
            new Sensor<Wall>({
              offset: [0, 0.3],
              sensorType: SensorType.ethernet,
              onUpdate: function (this: Sensor<Wall>) {
                const techRoom = this.parent.parent.parent.serverRoom;
                const point = this.parent.getPosition(WallSide.in, 3 / 4, 0);
                this.points = [
                  point,
                  mixPoints(techRoom, point, true),
                  techRoom,
                ];
              },
            }),
          ],
        }),
        // East
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('e', house, house.wallOuterThickness);
          },
          parts: [
            ...[SensorType.camera, SensorType.poe].map(
              (sensorType) =>
                new Sensor<Wall>({
                  sensorType,
                  cableType: CableType.OutsidePOE,
                  offsetWall: -0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const point = this.parent.getPosition(WallSide.in, 0, 0);
                    this.points = [
                      point,
                      offset(point, [-1, 1]),
                      house.serverRoom,
                    ];
                  },
                })
            ),
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 1 / 3, 0);

                this.points = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
            new Door({
              scale: [-1, -1],
              // outside: true,
              onUpdate: function (this: Door, house: House) {
                const side = WallSide.in;
                const wall = this.parent;
                const wallMid = wall.innerWallLength / 2;
                this.origin = offset(wall.origin, [0, wallMid - this.width]);
              },
            }),
            new Door({
              scale: [-1, 1],
              outside: true,
              onUpdate: function (this: Door, house: House) {
                const side = WallSide.in;
                const wall = this.parent;
                const wallMid = wall.innerWallLength / 2;
                this.origin = offset(wall.origin, [0, wallMid + this.width]);
              },
            }),
          ],
        }),
        // south
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('s', house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              group: 3,
              amount: 2,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Wall>) {
                this.points = [this.parent.getPosition(WallSide.in, 1 / 3, 0)];
              },
            }),
            new Sensor<Wall>({
              group: 3,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, 0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                this.points = [this.parent.getPosition(WallSide.in, 2 / 3, 0)];
              },
            }),

            new Sensor<Wall>({
              sensorType: SensorType.ethernet,
              onUpdate: function (this: Sensor<Wall>) {
                const techRoom = this.parent.parent.parent.serverRoom;
                const point = this.parent.getPosition(WallSide.in, 1 / 4, 0);
                const point2 = this.parent.parent.northWestCorner;
                this.points = [
                  point,
                  mixPoints(point, point2, true),
                  point2,
                  mixPoints(techRoom, point2, true),
                  techRoom,
                ];
              },
            }),
          ],
        }),
        // west
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              3,
              0,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 2 / 3, 0);

                this.points = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
            new Door({
              scale: [1, 1],
              rotate: 180,
              onUpdate: function (this: Door, house: House) {
                const side = WallSide.in;
                const wallMid = this.parent.parent.height / 2;
                this.origin = offset(this.parent.sides[side][1], [
                  0,
                  wallMid - this.width,
                ]);
              },
            }),
            new Door({
              scale: [1, -1],
              rotate: 180,
              onUpdate: function (this: Door, house: House) {
                const side = WallSide.in;
                const wallMid = this.parent.parent.height / 2;
                this.origin = offset(this.parent.sides[side][1], [
                  0,
                  wallMid + this.width,
                ]);
              },
            }),
          ],
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 3,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            this.points = [
              offset(room.northWestCorner, [room.width, room.height / 2 - 1]),
              offset(room.northWestCorner, [room.width, 0]),
              offset(room.northWestCorner, [0, 0]),
              offset(room.northWestCorner, [0, room.height / 2 - 1]),
            ];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 3,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            this.points = [
              offset(room.northWestCorner, [0, room.height / 2 + 1]),
              offset(room.northWestCorner, [0, room.height]),
              offset(room.northWestCorner, [room.width, room.height]),
              offset(room.northWestCorner, [room.width, room.height / 2 + 1]),
            ];
          },
        }),
        new Sensor<Room>({
          group: 3,
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          classes: ['cable-connection'],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [0, 0]);
            this.points = [
              point,
              mixPoints(house.serverRoom, point, true),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          group: 3,
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          classes: ['cable-connection'],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [
              -house.wallInnerThickness,
              room.height / 2 + 1,
            ]);
            this.points = [
              offset(room.northWestCorner, [0, room.height / 2 + 1]),
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.light,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.center, [0, 0]);
            this.points = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),
    // South / center / Down
    new Room({
      name: 'Central',
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        this.northWestCorner = [house.stramien.in.we.b, house.stramien.in.ns.b];
        this.squaredRoom(
          house.stramien.in.we.c - house.stramien.in.we.b,
          house.stramien.in.ns.d - house.stramien.in.ns.b
        );
      },
      parts: [
        // east Short
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.ceiling = house.cross.ceilingHeight;
            this.innerWallLength =
              house.stramien.in.ns.d - house.stramien.in.ns.c;
            this.origin = offset(this.parent.northWestCorner, [
              this.parent.width,
              house.stramien.in.ns.c - house.stramien.in.ns.b,
            ]);
            this.sides = {
              [WallSide.in]: [
                offset(this.origin, [
                  house.wallOuterThickness,
                  +house.wallOuterThickness,
                ]),
                offset(this.origin, [
                  house.wallOuterThickness,
                  this.innerWallLength + house.wallOuterThickness,
                ]),
              ],
              [WallSide.in]: [
                offset(this.origin, [0, 0]),
                offset(this.origin, [0, this.innerWallLength]),
              ],
            };
          },
          parts: [
            new Sensor<Wall>({
              group: 4,
              amount: 3,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Wall>) {
                this.points = [this.parent.getPosition(WallSide.in, 1 / 2, 0)];
              },
            }),
            new Sensor<Wall>({
              group: 4,
              amount: 2,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Wall>) {
                this.points = [this.parent.getPosition(WallSide.in, 0, -1)];
              },
            }),
          ],
        }),
        // East theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('e', house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 0, 1.5);
                this.points = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),
        // South
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('s', house, house.wallOuterThickness);
          },
          parts: [],
        }),
        // West short
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.ceiling = house.cross.ceilingHeight;
            this.innerWallLength =
              house.stramien.in.ns.d - house.stramien.in.ns.c;
            this.origin = offset(this.parent.northWestCorner, [
              0,
              house.stramien.in.ns.d - house.stramien.in.ns.b,
            ]);
            this.sides = {
              [WallSide.in]: [
                offset(this.origin, [
                  -house.wallOuterThickness,
                  +house.wallOuterThickness,
                ]),
                offset(this.origin, [
                  -house.wallOuterThickness,
                  -this.innerWallLength + house.wallOuterThickness,
                ]),
              ],
              [WallSide.in]: [
                offset(this.origin, [0, 0]),
                offset(this.origin, [0, -this.innerWallLength]),
              ],
            };
          },
          parts: [
            new Sensor<Wall>({
              group: 5,
              amount: 6,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Wall>) {
                this.points = [this.parent.getPosition(WallSide.in, 1 / 2, 0)];
              },
            }),
            new Sensor<Wall>({
              group: 5,
              amount: 6,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Wall>) {
                this.points = [this.parent.getPosition(WallSide.in, 1, 1)];
              },
            }),
          ],
        }),

        // West theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('w', house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 1, -1.5);
                this.points = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),

        // North
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              0,
              1,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            new Door({
              rotate: 90,
              scale: [-1, 1],
              onUpdate: function (this: Door, house: House) {
                this.origin = this.parent.getPosition(WallSide.in, 0, 0);
              },
            }),
          ],
        }),
        new Sensor<Room>({
          group: 7,
          offset: [0.6, 0],
          sensorType: SensorType.perilex,
          verticalCableLength: 4,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point = offset(this.parent.northWestCorner, [
              0,
              this.parent.height - 2,
            ]);

            this.points = [
              point,
              mixPoints(point, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          group: 4,
          cableOnly: true,
          sensorType: SensorType.socket,
          amount: 2,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point = offset(this.parent.northWestCorner, [
              this.parent.width * 0.5,
              0,
            ]);

            this.points = [
              offset(this.parent.northWestCorner, [
                this.parent.width,
                this.parent.height,
              ]),
              offset(this.parent.northWestCorner, [this.parent.width, 0]),
              point,
              mixPoints(point, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          group: 5,
          cableOnly: true,
          sensorType: SensorType.socket,
          amount: 2,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point = offset(this.parent.northWestCorner, [
              this.parent.width * 0.5,
              0,
            ]);

            this.points = [
              offset(this.parent.northWestCorner, [0, this.parent.height]),
              offset(this.parent.northWestCorner, [0, 0]),
              point,
              mixPoints(point, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          group: 5,
          amount: 6,
          sensorType: SensorType.socket,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 0.3,
              this.parent.height * 0.8,
            ]);
            const point2 = offset(this.parent.northWestCorner, [
              0,
              this.parent.height * 0.8,
            ]);

            this.points = [point1, mixPoints(point1, point2, true), point2];
          },
        }),
        new Sensor<Room>({
          group: 5,
          amount: 2,
          offset: [0.3, 0],
          sensorType: SensorType.socket,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 0,
              this.parent.height * 0.15,
            ]);
            const point2 = offset(this.parent.northWestCorner, [
              0,
              this.parent.height * 0.15,
            ]);

            this.points = [point1, mixPoints(point1, point2, true), point2];
          },
        }),
        new Sensor<Room>({
          group: 4,
          amount: 2,
          offset: [-0.3, 0],
          sensorType: SensorType.socket,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 1,
              this.parent.height * 0.15,
            ]);
            const point2 = offset(this.parent.northWestCorner, [
              this.parent.width * 1,
              this.parent.height * 0.15,
            ]);

            this.points = [point1, mixPoints(point1, point2, true), point2];
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.smoke,
          verticalCableLength: 2 + 4,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 0.3,
              this.parent.height * 0.8,
            ]);
            const point2 = offset(this.parent.northWestCorner, [
              this.parent.width * 0,
              this.parent.height * 0.8,
            ]);
            const point3 = this.parent.northWestCorner;

            this.points = [
              point1,
              point2,
              point3,
              mixPoints(point3, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.ethernet,
          offset: [0.3, 0],
          onUpdate: function (this: Sensor<Room>) {
            const techRoom = this.parent.parent.serverRoom;
            const point = offset(this.parent.northWestCorner, [
              0,
              this.parent.height * 0.5 - 2,
            ]);
            this.points = [point, mixPoints(techRoom, point, false), techRoom];
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.ethernet,
          offset: [0.3, 0],
          onUpdate: function (this: Sensor<Room>) {
            const techRoom = this.parent.parent.serverRoom;
            const point = offset(this.parent.northWestCorner, [
              0,
              this.parent.height * 0.8,
            ]);
            this.points = [point, mixPoints(techRoom, point, false), techRoom];
          },
        }),
        new Sensor<Room>({
          offset: [-0.3, 0],
          sensorType: SensorType.ethernet,
          onUpdate: function (this: Sensor<Room>) {
            const techRoom = this.parent.parent.serverRoom;
            const point = offset(this.parent.northWestCorner, [
              this.parent.width,
              this.parent.height * 0.5 - 2,
            ]);
            this.points = [point, mixPoints(techRoom, point, false), techRoom];
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.pir,
          cableType: CableType.SharedEthernet,
          offset: [0, 0.3],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [room.width / 2, 0]);
            const point2 = mixPoints(point, house.serverRoom, true);
            this.points = [point, point2, house.serverRoom];
          },
        }),
      ],
    }),

    // Hall
    new Room({
      name: 'Hall',
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        this.northWestCorner = house.stair.stairOrigin;
        this.squaredRoom(
          house.stair.totalWidth - house.stair.walkWidth,
          house.stramien.in.ns.b -
            house.stair.stairOrigin[1] -
            house.wallInnerThickness
        );
      },
      parts: [
        new Sensor<Room>({
          sensorType: SensorType.pir,
          cableType: CableType.SharedEthernet,
          offset: [-0.3, 0],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [
              room.width,
              room.height - 1,
            ]);
            const point2 = offset(room.northWestCorner, [
              room.width,
              room.height,
            ]);
            this.points = [point, point2, house.serverRoom];
          },
        }),
        // East
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              1,
              2,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            new Door({
              rotate: 0,
              scale: [-1, 1],
              onUpdate: function (this: Door, house: House) {
                this.origin = this.parent.getPosition(
                  WallSide.in,
                  1,
                  -(1.2 + house.wallInnerThickness)
                );
              },
            }),
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 1, -2.5);
                this.points = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),

        // West
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('w', house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 0, 2.5);
                this.points = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),
      ],
    }),

    // Office
    new Room({
      name: 'Office',
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        this.northWestCorner = [house.stramien.in.we.b, house.stramien.in.ns.a];
        const hallLength = house.stramien.in.ns.b - house.stair.stairOrigin[1];
        this.squaredRoom(
          house.stramien.in.we.c - house.stramien.in.we.b,
          house.stramien.in.ns.b -
            house.stramien.in.ns.a -
            hallLength -
            house.wallInnerThickness
        );
      },
      parts: [
        // west theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('w', house, house.wallOuterThickness);
          },
          parts: [
            ...[2 / 6, 4 / 6].map(
              (distance) =>
                new Sensor<Wall>({
                  offsetWall: 0.3,
                  sensorType: SensorType.ethernet,
                  onUpdate: function (this: Sensor<Wall>) {
                    const techRoom = this.parent.parent.parent.serverRoom;
                    const point = this.parent.getPosition(
                      WallSide.in,
                      distance,
                      0
                    );
                    this.points = [
                      point,
                      mixPoints(techRoom, point, false),
                      techRoom,
                    ];
                  },
                })
            ),
          ],
        }),
        // south
        new Wall({
          type: WallType.inner,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              2,
              3,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            new Door({
              rotate: 90,
              scale: [1, 1],
              onUpdate: function (this: Door, house: House) {
                this.origin = this.parent.getPosition(
                  WallSide.in,
                  1,
                  -(
                    house.stair.totalWidth +
                    house.wallInnerThickness -
                    this.width
                  )
                );
              },
            }),
          ],
        }),
        // east theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('e', house, house.wallOuterThickness);
          },
          parts: [
            ...[SensorType.camera, SensorType.poe].map(
              (sensorType) =>
                new Sensor<Wall>({
                  sensorType,
                  cableType: CableType.OutsidePOE,
                  offsetWall: -0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const point = this.parent.getPosition(WallSide.in, 0, 0);
                    this.points = [
                      point,
                      offset(point, [-1, 1]),
                      house.serverRoom,
                    ];
                  },
                })
            ),
            ...[2 / 6, 4 / 6].map(
              (distance) =>
                new Sensor<Wall>({
                  offsetWall: -0.3,
                  sensorType: SensorType.ethernet,
                  onUpdate: function (this: Sensor<Wall>) {
                    const techRoom = this.parent.parent.parent.serverRoom;
                    const point = this.parent.getPosition(
                      WallSide.in,
                      distance,
                      0
                    );
                    this.points = [
                      point,
                      mixPoints(techRoom, point, false),
                      techRoom,
                    ];
                  },
                })
            ),
          ],
        }),
        // north theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic('n', house, house.wallOuterThickness);
          },
          parts: [
            ...[1 / 6, 5 / 6].map(
              (distance) =>
                new Sensor<Wall>({
                  offset: [0, 0.3],
                  sensorType: SensorType.ethernet,
                  onUpdate: function (this: Sensor<Wall>) {
                    const techRoom = this.parent.parent.parent.serverRoom;
                    const point = this.parent.getPosition(
                      WallSide.in,
                      distance,
                      0
                    );
                    this.points = [
                      point,
                      mixPoints(techRoom, point, false),
                      techRoom,
                    ];
                  },
                })
            ),
          ],
        }),

        new Sensor<Room>({
          sensorType: SensorType.smoke,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 0.5,
              this.parent.height * 0.5,
            ]);

            this.points = [
              point1,
              mixPoints(point1, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          via: Floor.ceiling,
          group: 6,
          offset: [0, 0.3], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [1, 0]);
            this.points = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          group: 6,
          offset: [0, 0.3], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [room.width - 1, 0]);
            this.points = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          group: 6,
          offset: [0.3, 0], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [0, room.height - 1]);
            this.points = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          group: 6,
          offset: [0.3, 0], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [0, 1]);
            this.points = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          group: 6,
          offset: [-0.3, 0], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [room.width, 1]);
            this.points = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          group: 6,
          offset: [-0.3, 0], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [
              room.width,
              room.height - 1,
            ]);
            this.points = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 6,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            house.serverRoom;

            this.points = [
              offset(room.northWestCorner, [0, room.height - 1]),
              offset(room.northWestCorner, [0, 0]),
              offset(room.northWestCorner, [room.width, 0]),
              offset(room.northWestCorner, [room.width, room.height]),
              offset(room.northWestCorner, [room.width * 0.5, room.height]),
              mixPoints(
                house.serverRoom,
                offset(room.northWestCorner, [room.width * 0.5, room.height]),
                false
              ),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),
    // toilet
    new Room({
      name: 'Toilet',
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const height = 1.2;
        const width = 0.8;
        this.northWestCorner = [
          house.stramien.in.we.b +
            house.stair.totalWidth -
            house.stair.walkWidth +
            house.wallInnerThickness,
          house.stramien.in.ns.b - height - house.wallInnerThickness,
        ];
        this.squaredRoom(width, height);
      },
      parts: [
        // North
        new Wall({
          type: WallType.inner,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              0,
              1,
              house,
              CornerType.straight,
              CornerType.outside
            );
          },
        }),

        // East
        new Wall({
          type: WallType.inner,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              1,
              2,
              house,
              CornerType.outside,
              CornerType.straight
            );
          },
        }),

        // West theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.ceiling = house.cross.ceilingHeight;
            this.thickness = house.wallInnerThickness;
            const room = this.parent;
            this.origin = offset(room.northWestCorner, [
              room.width * 0.0,
              room.height * 1.0,
            ]);
            this.innerWallLength = room.height;

            this.sides = {
              [WallSide.in]: [
                offset(this.origin, [0, 0]),
                offset(this.origin, [0, -this.innerWallLength]),
              ],
            };
          },
          parts: [
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 0, 0.8);
                this.points = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
            new Door({
              scale: [1, 1],
              rotate: 0,
              floor: Floor.ground,
              onUpdate: function (this: Door, house: House) {
                this.origin = offset(
                  this.parent.getPosition(WallSide.in, 0, 0),
                  [-house.wallInnerThickness, 0]
                );
              },
            }),
          ],
        }),
      ],
    }),

    // Server / Tech / Boiler Room
    new Room({
      name: 'Server',
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const height = 1.0;
        const toiletOffset =
          house.stramien.in.we.b +
          house.stair.totalWidth -
          house.stair.walkWidth +
          1.2;

        this.northWestCorner = [
          toiletOffset,
          house.stramien.in.ns.b - height - house.wallInnerThickness,
        ];
        this.squaredRoom(house.stramien.in.we.c - toiletOffset, height);
      },
      parts: [
        new Wall({
          type: WallType.inner,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              0,
              1,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.smoke,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = this.parent.center;
            this.points = [
              point1,
              mixPoints(point1, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),

        ...[SensorType.poe, SensorType.wifi].map(
          (sensorType) =>
            new Sensor<Room>({
              offset: [0, 0.3],
              sensorType,
              onUpdate: function (this: Sensor<Room>, house: House) {
                const point1 = this.parent.center;
                this.points = [
                  point1,
                  mixPoints(point1, house.serverRoom, true),
                  house.serverRoom,
                ];
              },
            })
        ),
        ...[SensorType.lightSwitch, SensorType.temperature].map(
          (sensorType) =>
            new Sensor<Room>({
              sensorType,
              offset: [0, 0.3],
              onUpdate: function (this: Sensor<Room>, house: House) {
                const room = this.parent;
                const point = offset(room.northWestCorner, [
                  room.width * 0.2,
                  room.height * 0.0,
                ]);
                const point2 = offset(room.northWestCorner, [
                  room.width * 0.0,
                  room.height * 0.0,
                ]);
                this.points = [
                  point,
                  point2,
                  mixPoints(house.serverRoom, point2, false),
                  house.serverRoom,
                ];
              },
            })
        ),
      ],
    }),

    // Tower
    new Room({
      name: 'Tower',
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        this.outOfDesign = !house.showTower;
        if (this.outOfDesign) return;
        const wallDiff = house.wallOuterThickness - house.wallInnerThickness;
        this.northWestCorner = [
          house.stramien.out.we.c - wallDiff,
          house.tower.innerCoords[0][1],
        ];

        this.center = offset(this.northWestCorner, [1, 1]);
        this.centralElectricity = this.center;
        this.coords = [
          this.northWestCorner,
          house.tower.innerCoords[0],
          house.tower.innerCoords[1],
          house.tower.innerCoords[2],
          house.tower.innerCoords[3],
          [
            house.tower.innerCoords[3][0],
            house.stramien.in.ns.b - house.wallInnerThickness,
          ],
          [
            this.northWestCorner[0],
            house.stramien.in.ns.b - house.wallInnerThickness,
          ],
        ];
      },
      parts: [
        // South
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.outOfDesign = !house.showTower;
            if (this.outOfDesign) return;
            this.drawByRoom(
              6,
              0,
              house,
              CornerType.outside,
              CornerType.straight
            );
          },
          parts: [
            new Door({
              scale: [1, 1],
              rotate: 180,
              floor: Floor.ground,
              onUpdate: function (this: Door, house: House) {
                this.outOfDesign = !house.showTower;
                if (this.outOfDesign) return;
                this.floor = Floor.ground;
                this.origin = this.parent.getPosition(WallSide.in, 1, 0);
              },
            }),
          ],
        }),
        // // west
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.outOfDesign = !house.showTower;
            if (this.outOfDesign) return;
            this.drawByRoom(
              5,
              6,
              house,
              CornerType.straight,
              CornerType.outside
            );
          },
          parts: [
            new Door({
              scale: [-1, 1],
              rotate: -90,
              floor: Floor.ground,
              onUpdate: function (this: Door, house: House) {
                this.outOfDesign = !house.showTower;
                if (this.outOfDesign) return;
                this.floor = Floor.ground;
                this.origin = this.parent.getPosition(
                  WallSide.in,
                  0,
                  house.wallInnerThickness
                );
              },
            }),
          ],
        }),
        new Sensor<Room>({
          sensorType: SensorType.pir,
          cableType: CableType.SharedEthernet,
          offset: [0.3, 0],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [0, room.height - 1]);
            const point2 = mixPoints(point, house.serverRoom, true);
            this.points = [point, point2, house.serverRoom];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 4,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            house.serverRoom;
            this.points = [
              group,
              mixPoints(group, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),

    // Laundry
    new Room({
      name: 'Laundry',
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const height =
          house.stramien.in.ns.b -
          house.stair.stairOrigin[1] -
          1.2 -
          house.wallInnerThickness * 2;
        const stairsOffset =
          house.stramien.in.we.b +
          house.stair.totalWidth -
          house.stair.walkWidth +
          house.wallInnerThickness;

        this.northWestCorner = [stairsOffset, house.stair.stairOrigin[1]];

        const toiletServer: xy = [
          stairsOffset + 1.2 - house.wallInnerThickness,
          house.stramien.in.ns.b - 1 - house.wallInnerThickness * 2,
        ];

        this.width = round(3, house.stramien.in.we.c - stairsOffset);
        const width = this.width;
        this.height = round(3, height);
        this.coords = [
          this.northWestCorner,
          offset(this.northWestCorner, [width, 0]),
          offset(this.northWestCorner, [width, height]),
          [this.northWestCorner[0] + width, toiletServer[1]],
          toiletServer,
          [toiletServer[0], this.northWestCorner[1] + height],
          offset(this.northWestCorner, [0, height]),
        ];

        this.center = offset(this.northWestCorner, [width / 2, height / 2]);
        this.centralElectricity = this.center;
      },
      parts: [
        new Sensor<Room>({
          sensorType: SensorType.smoke,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = this.parent.center;
            this.points = [
              point1,
              mixPoints(point1, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.ethernet,
          offset: [0.3, 0],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const techRoom = house.serverRoom;
            const room = this.parent;
            const point = offset(room.northWestCorner, [
              room.width * 0.0,
              room.height * 0.5,
            ]);
            this.points = [point, mixPoints(techRoom, point, false), techRoom];
          },
        }),
      ],
    }),

    //  upstairs
    ...lindeLundUpstairs,
  ],
};

import { Polygon } from "ol/geom";
import { Floor, SensorType } from "src/app/components/enum.data";
import { AppPolygon } from "src/app/model/polygon.model";
import { Door } from "src/app/model/specific/door.model";
import { Room } from "src/app/model/specific/room.model";
import { Sensor } from "src/app/model/specific/sensors/sensor.model";
import { SensorLight } from "src/app/model/specific/sensors/sensorLight.model";
import { Vent } from "src/app/model/specific/sensors/vent.model";
import { Water } from "src/app/model/specific/sensors/water.model";
import { Wall, WallSide, WallType } from "src/app/model/specific/wall.model";
import { Window, WindowForm } from "src/app/model/specific/window.model";
import {
  getDiagonal,
  mixPoints,
  offset,
  round,
} from "src/app/shared/global-functions";
import { House, xy } from "../house.model";

export const lindeLundUpstairs = [
  // toilet upstairs
  new Room({
    name: "Toilet-upstairs",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const height = 1.0;
      const width = 1.7;
      this.northWestCorner = [
        house.stramien.in.we.b,
        house.stramien.in.ns.b - height - house.wallInnerThickness,
      ];
      this.squaredRoom(width, height);
    },
    parts: [
      // North
      new Wall({
        floor: Floor.top,
        type: WallType.inner,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          this.origin = offset(this.parent.northWestCorner, [0, 0]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [0, -house.wallInnerThickness]),
              offset(this.origin, [
                this.parent.width + house.wallInnerThickness,
                -house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [this.parent.width, 0]),
            ],
          };
        },
        parts: [
          new Water<Wall>({
            sensorType: SensorType.drain,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const point = offset(
                this.parent.getPosition(WallSide.in, 1 / 2, 0),
                [0, 0]
              );
              const room = this.parent.parent;
              const point2: xy = [
                point[0],
                room.northWestCorner[1] + room.height / 2,
              ];
              this.points = [point, point2];
            },
          }),
          new Water<Wall>({
            sensorType: SensorType.waterWarm,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const point = offset(
                this.parent.getPosition(WallSide.in, 1 / 2, 0),
                [0, 0]
              );
              const room = this.parent.parent;
              this.points = [
                point,
                mixPoints(house.serverRoom, point, true),
                house.serverRoom,
              ];
            },
          }),
        ],
      }),

      // East
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [room.width, 0]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [
                +house.wallInnerThickness,
                -house.wallInnerThickness,
              ]),
              offset(this.origin, [
                +house.wallInnerThickness,
                room.height + house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [0, room.height]),
            ],
          };
        },
      }),

      // South
      new Wall({
        floor: Floor.top,
        type: WallType.inner,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [room.width, room.height]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [
                +house.wallInnerThickness,
                house.wallInnerThickness,
              ]),
              offset(this.origin, [-room.width, house.wallInnerThickness]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [-room.width, 0]),
            ],
          };
        },
        parts: [
          new Sensor<Wall>({
            sensorType: SensorType.lightSwitch,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const point = this.parent.getPosition(WallSide.in, 0, 1);
              this.points = [
                point,
                mixPoints(house.serverRoom, point, true),
                house.serverRoom,
              ];
            },
          }),
          new Sensor<Wall>({
            offsetWall: -0.3,
            sensorType: SensorType.lightSwitch,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const point = offset(this.parent.getPosition(WallSide.in, 0, 1), [
                0,
                house.wallInnerThickness,
              ]);
              this.points = [
                point,
                mixPoints(house.serverRoom, point, true),
                house.serverRoom,
              ];
            },
          }),
          new Door({
            scale: [-1, 1],
            rotate: -90,
            onUpdate: function (this: Door, house: House) {
              this.origin = offset(this.parent.getPosition(WallSide.in, 0, 0), [
                -house.wallInnerThickness,
                0,
              ]);
            },
          }),
        ],
      }),
      // West theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
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
          new Water<Wall>({
            sensorType: SensorType.toilet,
            size: 120,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const point = offset(
                this.parent.getPosition(WallSide.in, 1 / 2, 0),
                [house.cross.minimumHeightWidth + 0.1, 0]
              );
              this.points = [
                point,
                mixPoints(house.serverRoom, point, true),
                house.serverRoom,
              ];
            },
          }),
        ],
      }),
      new SensorLight<Room>({
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
      new Vent<Room>({
        sensorType: SensorType.ventIn,
        size: 200,
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const point = room.center;
          this.points = [
            point,
            mixPoints(house.serverRoom, point, false),
            house.serverRoom,
          ];
        },
      }),
    ],
  }),

  // storage upstairs
  new Room({
    name: "storage-upstairs",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const height = 1.0;
      const width = 1.7;
      this.northWestCorner = [
        house.stramien.in.we.b,
        house.stramien.in.ns.b - height - house.wallInnerThickness * 2 - 1,
      ];
      this.squaredRoom(width, height);
    },
    parts: [
      // North
      new Wall({
        floor: Floor.top,
        type: WallType.inner,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          this.origin = offset(this.parent.northWestCorner, [0, 0]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [0, -house.wallInnerThickness]),
              offset(this.origin, [
                this.parent.width + house.wallInnerThickness,
                -house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [this.parent.width, 0]),
            ],
          };
        },
      }),

      // East
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [room.width, 0]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [
                +house.wallInnerThickness,
                -house.wallInnerThickness,
              ]),
              offset(this.origin, [+house.wallInnerThickness, room.height]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [0, room.height]),
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
            scale: [-1, 1],
            rotate: 180,
            onUpdate: function (this: Door, house: House) {
              this.origin = offset(this.parent.getPosition(WallSide.in, 0, 0), [
                -house.wallInnerThickness,
                0,
              ]);
            },
          }),
        ],
      }),
      new SensorLight<Room>({
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

  // Main bedroom
  new Room({
    name: "main-bedroom",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const mainBedroomSetBack = 1;
      this.width = round(house.stramien.in.we.c - house.stramien.in.we.b);
      this.northWestCorner = [house.stramien.in.we.b, house.stramien.in.ns.a];
      this.height = round(
        house.stramien.in.ns.b -
          this.northWestCorner[1] -
          house.tower.houseIncrement -
          house.wallInnerThickness -
          mainBedroomSetBack
      );

      this.center = offset(this.northWestCorner, [
        this.width / 2,
        this.height / 2,
      ]);
      this.centralElectricity = this.center;

      const midWall = house.stair.totalWidth + house.wallInnerThickness;
      const stairWall =
        house.stair.stairOrigin[1] -
        this.northWestCorner[1] -
        house.wallInnerThickness;

      this.coords = [
        this.northWestCorner,
        offset(this.northWestCorner, [this.width, 0]),
        offset(this.northWestCorner, [this.width, this.height]),
        offset(this.northWestCorner, [midWall, this.height]),
        offset(this.northWestCorner, [midWall, stairWall]),
        offset(this.northWestCorner, [0, stairWall]),
      ];
    },
    parts: [
      // North theoretic
      new Wall({
        floor: Floor.top,
        type: WallType.theoretic,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          this.thickness = house.wallOuterThickness;
          this.origin = offset(this.parent.northWestCorner, [0, 0]);
          this.sides = {
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [this.parent.width, 0]),
            ],
          };
        },
        parts: [
          new Sensor<Wall>({
            offset: [0, 0.3],
            amount: 2,
            sensorType: SensorType.socket,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const techRoom = house.serverRoom;
              const point = this.parent.getPosition(WallSide.in, 1 / 2, -0.4);
              this.points = [point, mixPoints(techRoom, point, true), techRoom];
            },
          }),
        ],
      }),
      // SouthRight
      new Wall({
        floor: Floor.top,
        type: WallType.inner,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = room.coords[2];
          this.innerWallLength = getDiagonal(room.coords[3], room.coords[2]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [0, house.wallInnerThickness]),
              offset(this.origin, [
                -(this.innerWallLength + house.wallInnerThickness),
                house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [-this.innerWallLength, 0]),
            ],
          };
        },
        parts: [
          new Door({
            scale: [1, 1],
            rotate: 90,
            onUpdate: function (this: Door, house: House) {
              this.origin = offset(
                this.parent.getPosition(WallSide.in, 1, 0),
                [0, 0]
              );
            },
          }),
          ...[SensorType.lightSwitch, SensorType.temperature].map(
            (sensorType) =>
              new Sensor<Wall>({
                sensorType,
                onUpdate: function (this: Sensor<Wall>, house: House) {
                  const point = this.parent.getPosition(WallSide.in, 1, -1);
                  this.points = [
                    point,
                    mixPoints(house.serverRoom, point, false),
                    house.serverRoom,
                  ];
                },
              })
          ),
        ],
      }),
      // MidWest
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          this.thickness = house.wallInnerThickness;
          const room = this.parent;
          this.origin = room.coords[3];
          this.innerWallLength = getDiagonal(room.coords[4], room.coords[3]);

          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [
                -house.wallInnerThickness,
                house.wallInnerThickness,
              ]),
              offset(this.origin, [
                -house.wallInnerThickness,
                -this.innerWallLength + house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [0, -this.innerWallLength]),
            ],
          };
        },
      }),

      // SouthLeft
      new Wall({
        name: "SouthLeft",
        floor: Floor.top,
        type: WallType.inner,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = room.coords[4];
          this.innerWallLength = getDiagonal(room.coords[5], room.coords[4]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [
                -house.wallInnerThickness,
                house.wallInnerThickness,
              ]),
              offset(this.origin, [
                -this.innerWallLength,
                house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [-this.innerWallLength, 0]),
            ],
          };
        },
        parts: [
          new Sensor<Wall>({
            offset: [0, 0.3],
            sensorType: SensorType.ethernet,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const techRoom = house.serverRoom;
              const point = this.parent.getPosition(WallSide.in, 0, 0.3);
              this.points = [point, mixPoints(techRoom, point, true), techRoom];
            },
          }),

          new Sensor<Wall>({
            offset: [0, 0.3],
            amount: 2,
            sensorType: SensorType.socket,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const techRoom = house.serverRoom;
              const point = this.parent.getPosition(WallSide.in, 0, 0);
              this.points = [point, mixPoints(techRoom, point, true), techRoom];
            },
          }),
        ],
      }),

      new Sensor<Room>({
        sensorType: SensorType.lightSwitch,
        onUpdate: function (this: Sensor<Room>, house: House) {
          const point = this.parent.centralElectricity;
          this.points = [
            point,
            mixPoints(house.serverRoom, point, false),
            house.serverRoom,
          ];
        },
      }),
      new SensorLight<Room>({
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const point = offset(room.center, [1, 0]);
          this.points = [
            point,
            mixPoints(house.serverRoom, point, false),
            house.serverRoom,
          ];
        },
      }),
      new Vent<Room>({
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const point = offset(room.northWestCorner, [room.width / 2, 2]);
          this.points = [
            point,
            mixPoints(house.serverRoom, point, false),
            house.serverRoom,
          ];
        },
      }),
    ],
  }),

  // Bathroom
  new Room({
    name: "bathroom",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const mainBedroomSetBack = 1;
      const towerSetBack = 0.5;
      const towerSetBackWidth = 2;
      const northWall =
        house.stramien.in.ns.b -
        house.stramien.in.ns.a -
        house.tower.houseIncrement +
        house.wallInnerThickness +
        house.wallInnerThickness -
        mainBedroomSetBack;
      const hallWall =
        house.stair.stairOrigin[0] +
        house.stair.totalWidth +
        1.0001 +
        house.wallInnerThickness;
      const stairWall = house.stramien.in.ns.b - towerSetBack;
      const stairWallShort = house.tower.innerCoords[3][0] - towerSetBackWidth;
      this.northWestCorner = [hallWall, northWall];
      this.center = offset(this.northWestCorner, [2, 2]);
      this.coords = [
        this.northWestCorner,
        [house.stramien.in.we.c, northWall],
        [house.stramien.in.we.c, house.tower.innerCoords[0][1]],
        house.tower.innerCoords[1],
        house.tower.innerCoords[2],
        [house.tower.innerCoords[3][0], stairWall],
        [stairWallShort, stairWall],
        [stairWallShort, house.stramien.in.ns.b - house.wallInnerThickness],
        [
          this.northWestCorner[0],
          house.stramien.in.ns.b - house.wallInnerThickness,
        ],
      ];
    },
    parts: [
      // SouthRight
      new Wall({
        floor: Floor.top,
        type: WallType.inner,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = room.coords[5];
          this.innerWallLength = getDiagonal(room.coords[5], room.coords[6]);
          this.sides = {
            [WallSide.out]: [
              offset(room.coords[5], [0, house.wallInnerThickness]),
              offset(room.coords[6], [
                house.wallInnerThickness,
                house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(room.coords[5], [0, 0]),
              offset(room.coords[6], [0, 0]),
            ],
          };
        },
        parts: [
          new Water<Wall>({
            sensorType: SensorType.shower,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const wall = this.parent;
              const room = wall.parent;

              const point = this.parent.getPosition(
                WallSide.in,
                0,
                house.tower.width
              );

              this.points = [
                offset(point, [0, -0.3]),
                point,
                mixPoints(house.serverRoom, point, true),
                house.serverRoom,
              ];
            },
          }),
          new Water<Wall>({
            sensorType: SensorType.drain,
            size:50,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const wall = this.parent;
              const room = wall.parent;

              const point = this.parent.getPosition(
                WallSide.in,
                0,
                house.tower.width
              );

              this.points = [
                offset(point, [0, -0.3]),
                point,
                mixPoints(house.serverRoom, point, true),
                house.serverRoom,
              ];
            },
          }),
        ],
      }),
      // MidEast
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = room.coords[6];
          this.innerWallLength = getDiagonal(room.coords[6], room.coords[7]);
          this.sides = {
            [WallSide.out]: [
              offset(room.coords[6], [
                house.wallInnerThickness,
                house.wallInnerThickness,
              ]),
              offset(room.coords[7], [
                house.wallInnerThickness,
                house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(room.coords[6], [0, 0]),
              offset(room.coords[7], [0, 0]),
            ],
          };
        },
      }),

      // SouthLeft
      new Wall({
        name: "SouthLeft",
        floor: Floor.top,
        type: WallType.inner,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = room.coords[5];
          this.innerWallLength = getDiagonal(room.coords[7], room.coords[8]);
          this.sides = {
            [WallSide.out]: [
              offset(room.coords[7], [
                house.wallInnerThickness,
                house.wallInnerThickness,
              ]),
              offset(room.coords[8], [
                -house.wallInnerThickness,
                house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(room.coords[7], [0, 0]),
              offset(room.coords[8], [0, 0]),
            ],
          };
        },
        parts: [
          new Door({
            scale: [1, 1],
            rotate: 90,
            onUpdate: function (this: Door, house: House) {
              this.origin = offset(
                this.parent.getPosition(WallSide.in, 1, 0),
                [0, 0]
              );
            },
          }),
          ...[SensorType.lightSwitch, SensorType.temperature].map(
            (sensorType) =>
              new Sensor<Wall>({
                amount: sensorType === SensorType.lightSwitch ? 2 : 1,
                sensorType,
                onUpdate: function (this: Sensor<Wall>, house: House) {
                  const point = this.parent.getPosition(WallSide.in, 1, -1);
                  this.points = [
                    point,
                    mixPoints(house.serverRoom, point, true),
                    house.serverRoom,
                  ];
                },
              })
          ),
          ...[SensorType.lightSwitch, SensorType.temperature].map(
            (sensorType) =>
              new Sensor<Wall>({
                offsetWall: -0.3,
                sensorType,
                onUpdate: function (this: Sensor<Wall>, house: House) {
                  const point = offset(
                    this.parent.getPosition(WallSide.in, 1, -1),
                    [0, house.wallInnerThickness]
                  );
                  this.points = [
                    point,
                    mixPoints(house.serverRoom, point, true),
                    house.serverRoom,
                  ];
                },
              })
          ),
        ],
      }),

      // West
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = room.coords[8];
          this.innerWallLength = getDiagonal(room.coords[8], room.coords[0]);
          this.sides = {
            [WallSide.out]: [
              offset(room.coords[8], [
                -house.wallInnerThickness,
                house.wallInnerThickness,
              ]),
              offset(room.coords[0], [-house.wallInnerThickness, 0]),
            ],
            [WallSide.in]: [
              offset(room.coords[8], [0, 0]),
              offset(room.coords[0], [0, 0]),
            ],
          };
        },
        parts: [
          new Sensor<Wall>({
            offsetWall: -0.3,
            sensorType: SensorType.ethernet,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const techRoom = house.serverRoom;
              const point = this.parent.getPosition(WallSide.in, 1, -0.5);
              this.points = [
                offset(point, [-house.wallInnerThickness, 0]),
                mixPoints(techRoom, point, true),
                techRoom,
              ];
            },
          }),

          ...[0, 1, 2].map(
            (i) =>
              new Sensor<Wall>({
                amount: i === 1 ? 2 : 1,
                offsetWall: i === 1 ? -0.3 : 0.3,
                sensorType: SensorType.socket,
                onUpdate: function (this: Sensor<Wall>, house: House) {
                  const techRoom = house.serverRoom;
                  const point = this.parent.getPosition(
                    WallSide.in,
                    (i + 1) / 4,
                    0
                  );
                  this.points = [
                    offset(point, [i === 1 ? -house.wallInnerThickness : 0, 0]),
                    offset(point, [0, 0]),
                    mixPoints(techRoom, point, false),
                    techRoom,
                  ];
                },
              })
          ),

          new Water<Wall>({
            sensorType: SensorType.drain,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const room = this.parent.parent;
              const wall = this.parent;
              const point = offset(
                wall.getPosition(WallSide.in, 2 / 3, 0),
                [0.3, 0]
              );
              const point2 = offset(
                wall.getPosition(WallSide.in, 1 / 3, 0),
                [0.3, 0]
              );
              this.points = [point, point2];
            },
          }),
          new Water<Wall>({
            sensorType: SensorType.drain,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const room = this.parent.parent;
              const wall = this.parent;
              const point = offset(
                wall.getPosition(WallSide.in, 1 / 3, 0),
                [0.3, 0]
              );
              const point2: xy = [
                point[0],
                house.stramien.in.ns.b - (0.5 + house.wallInnerThickness),
              ];
              this.points = [point, point2];
            },
          }),
          new Water<Wall>({
            sensorType: SensorType.waterWarm,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const point = offset(
                this.parent.getPosition(WallSide.in, 2 / 3, 0),
                [0.3, 0]
              );
              const point2 = offset(
                this.parent.getPosition(WallSide.in, 1 / 3, 0),
                [0.3, 0]
              );
              this.points = [point, point2];
            },
          }),

          new Water<Wall>({
            sensorType: SensorType.waterWarm,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const point = offset(
                this.parent.getPosition(WallSide.in, 1 / 3, 0),
                [0.3, 0]
              );
              this.points = [point];
            },
          }),

          ...[SensorType.lightSwitch, SensorType.temperature].map(
            (sensorType) =>
              new Sensor<Wall>({
                offsetWall: -0.3,
                sensorType,
                onUpdate: function (this: Sensor<Wall>, house: House) {
                  const point = offset(
                    this.parent.getPosition(WallSide.in, 1, -1),
                    [-house.wallInnerThickness, 0]
                  );
                  this.points = [
                    point,
                    mixPoints(house.serverRoom, point, false),
                    house.serverRoom,
                  ];
                },
              })
          ),
        ],
      }),
      new SensorLight<Room>({
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
      new Vent<Room>({
        sensorType: SensorType.ventIn,
        size: 400,
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const point = offset(house.serverRoom, [0, -1]);
          this.points = [
            point,
            mixPoints(house.serverRoom, point, false),
            house.serverRoom,
          ];
        },
      }),
    ],
  }),

  // East / Right
  new Room({
    name: "Upper-east",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const wallDiff = house.wallOuterThickness - house.wallInnerThickness;
      const s = house.stramien;
      this.northWestCorner = [
        s.in.we.c + house.wallInnerThickness,
        s.in.ns.b + house.balconyWidth + house.wallInnerThickness,
      ];
      this.squaredRoom(
        s.in.we.d - s.in.we.c - house.wallInnerThickness,
        s.in.ns.c - s.in.ns.b - house.balconyWidth - house.wallInnerThickness
      );
    },
    parts: [
      // North
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [
            room.width * 0,
            room.height * 0,
          ]);
          this.sides = {
            [WallSide.out]: [
              offset(room.northWestCorner, [
                -house.wallInnerThickness,
                -house.wallInnerThickness,
              ]),
              offset(room.northWestCorner, [
                room.width * 1,
                room.height * 0 - house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(room.northWestCorner, [room.width * 0, room.height * 0]),
              offset(room.northWestCorner, [room.width * 1, room.height * 0]),
            ],
          };
        },
        parts: [
          ...[SensorType.lightSwitch, SensorType.temperature].map(
            (sensorType) =>
              new Sensor<Wall>({
                sensorType,
                onUpdate: function (this: Sensor<Wall>, house: House) {
                  const point = this.parent.getPosition(WallSide.in, 0, 1);
                  this.points = [
                    point,
                    mixPoints(house.serverRoom, point, false),
                    house.serverRoom,
                  ];
                },
              })
          ),
          new Sensor<Wall>({
            offset: [0, 0.3],
            sensorType: SensorType.ethernet,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const techRoom = house.serverRoom;
              const point = this.parent.getPosition(WallSide.in, 0, 1);
              this.points = [
                point,
                mixPoints(techRoom, point, false),
                techRoom,
              ];
            },
          }),

          new Door({
            scale: [1, -1],
            rotate: -90,
            onUpdate: function (this: Door, house: House) {
              this.origin = offset(
                this.parent.getPosition(WallSide.in, 0, 0),
                [0, 0]
              );
            },
          }),
        ],
      }),
      // East theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [
            room.width * 1,
            room.height * 0,
          ]);
          this.sides = {
            [WallSide.in]: [
              offset(room.northWestCorner, [room.width * 1, room.height * 0]),
              offset(room.northWestCorner, [room.width * 1, room.height * 1]),
            ],
          };
        },
      }),
      // South theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [
            room.width * 1,
            room.height * 1,
          ]);
          this.sides = {
            [WallSide.in]: [
              offset(room.northWestCorner, [room.width * 1, room.height * 1]),
              offset(room.northWestCorner, [room.width * 0, room.height * 1]),
            ],
          };
        },
      }),
      // west hall
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = room.coords[1];
          this.sides = {
            [WallSide.out]: [
              offset(room.northWestCorner, [
                room.width * 0 - house.wallInnerThickness,
                room.height * 1,
              ]),
              offset(room.northWestCorner, [
                room.width * 0 - house.wallInnerThickness,
                room.height * 0 - house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(room.northWestCorner, [room.width * 0, room.height * 1]),
              offset(room.northWestCorner, [room.width * 0, room.height * 0]),
            ],
          };
        },
      }),
      ...[
        ...[0, 1, 2, 3].map(
          (i) =>
            new Sensor<Room>({
              offset: [[0, 3].includes(i) ? 0.3 : -0.3, 0],
              group: 11,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Room>, house: House) {
                const room = this.parent;
                this.points = [
                  offset(room.coords[i], [0, [0, 1].includes(i) ? 1 : -1]),
                ];
              },
            })
        ),
        new Sensor<Room>({
          group: 11,
          sensorType: SensorType.socket,
          cableOnly: true,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const techRoom = house.serverRoom;
            const room = this.parent;
            const point = offset(room.coords[0], [1, 0]);
            this.points = [
              point,
              room.coords[1],
              room.coords[2],
              room.coords[3],
              room.coords[0],
              mixPoints(techRoom, room.coords[0], false),
              techRoom,
            ];
          },
        }),
      ],
      new SensorLight<Room>({
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
      new Vent<Room>({
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const point = offset(room.northWestCorner, [room.width / 2, 2]);
          const point2: xy = [
            room.northWestCorner[0] + room.width / 2,
            house.stramien.in.ns.b + house.balconyWidth / 2,
          ];
          this.points = [
            point,
            point2,
            mixPoints(house.serverRoom, point2, true),
            house.serverRoom,
          ];
        },
      }),
    ],
  }),

  // upper-west-one
  new Room({
    name: "upper-west-one",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const s = house.stramien;
      const height =
        s.in.ns.c - s.in.ns.b - house.balconyWidth - house.wallInnerThickness;
      const width = (s.in.we.b - s.in.we.a) / 3 - house.wallInnerThickness;
      this.northWestCorner = [
        s.in.we.b - (s.in.we.b - s.in.we.a) * (1 / 3),
        s.in.ns.b + house.balconyWidth + house.wallInnerThickness,
      ];
      this.squaredRoom(width, height);
    },
    parts: [
      // North
      new Wall({
        floor: Floor.top,
        type: WallType.inner,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          this.origin = offset(this.parent.northWestCorner, [0, 0]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [0, -house.wallInnerThickness]),
              offset(this.origin, [
                this.parent.width + house.wallInnerThickness,
                -house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [this.parent.width, 0]),
            ],
          };
        },
        parts: [
          ...[SensorType.lightSwitch, SensorType.temperature].map(
            (sensorType) =>
              new Sensor<Wall>({
                sensorType,
                onUpdate: function (this: Sensor<Wall>, house: House) {
                  const point = this.parent.getPosition(WallSide.in, 1, -1);
                  this.points = [
                    point,
                    mixPoints(house.serverRoom, point, false),
                    house.serverRoom,
                  ];
                },
              })
          ),
          new Sensor<Wall>({
            offset: [0, 0.3],
            sensorType: SensorType.ethernet,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const techRoom = house.serverRoom;
              const point = this.parent.getPosition(WallSide.in, 1, -1);
              this.points = [
                point,
                mixPoints(techRoom, point, false),
                techRoom,
              ];
            },
          }),
          new Door({
            scale: [1, 1],
            rotate: -90,
            onUpdate: function (this: Door, house: House) {
              this.origin = offset(
                this.parent.getPosition(WallSide.in, 1, 0),
                [0, 0]
              );
            },
          }),
        ],
      }),

      // East
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [room.width, 0]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [
                +house.wallInnerThickness,
                -house.wallInnerThickness,
              ]),
              offset(this.origin, [+house.wallInnerThickness, room.height]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [0, room.height]),
            ],
          };
        },
        parts: [],
      }),

      // South theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [room.width, room.height]);
          this.sides = {
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [room.width * -1, room.height * 0]),
            ],
          };
        },
        parts: [],
      }),

      // West theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [
            room.width * 0,
            room.height * 1,
          ]);
          this.sides = {
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [room.width * 0, room.height * -1]),
            ],
          };
        },
        parts: [],
      }),
      ...[
        ...[0, 1, 2, 3].map(
          (i) =>
            new Sensor<Room>({
              offset: [[0, 3].includes(i) ? 0.3 : -0.3, 0],
              group: 10,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Room>, house: House) {
                const room = this.parent;
                this.points = [
                  offset(room.coords[i], [0, [0, 1].includes(i) ? 1 : -1]),
                ];
              },
            })
        ),
        new Sensor<Room>({
          group: 10,
          sensorType: SensorType.socket,
          cableOnly: true,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const techRoom = house.serverRoom;
            const room = this.parent;
            const point = offset(room.coords[1], [-1, 0]);
            this.points = [
              room.coords[1],
              room.coords[2],
              room.coords[3],
              room.coords[0],
              point,
              // mixPoints(techRoom, point, false),
              // techRoom,
            ];
          },
        }),
      ],
      new SensorLight<Room>({
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
      new Vent<Room>({
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const point = offset(room.northWestCorner, [room.width / 2, 2]);
          const point2: xy = [
            room.northWestCorner[0] + room.width / 2,
            house.stramien.in.ns.b + house.balconyWidth / 2,
          ];
          this.points = [
            point,
            point2,
            mixPoints(house.serverRoom, point2, true),
            house.serverRoom,
          ];
        },
      }),
    ],
  }),
  // upper-west-two
  new Room({
    name: "upper-west-two",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const s = house.stramien;
      const height =
        s.in.ns.c - s.in.ns.b - house.balconyWidth - house.wallInnerThickness;
      const width = (s.in.we.b - s.in.we.a) / 3 - house.wallInnerThickness;
      this.northWestCorner = [
        s.in.we.b - (s.in.we.b - s.in.we.a) * (2 / 3),
        s.in.ns.b + house.balconyWidth + house.wallInnerThickness,
      ];
      this.squaredRoom(width, height);
    },
    parts: [
      // North
      new Wall({
        floor: Floor.top,
        type: WallType.inner,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          this.origin = offset(this.parent.northWestCorner, [0, 0]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [0, -house.wallInnerThickness]),
              offset(this.origin, [
                this.parent.width + house.wallInnerThickness,
                -house.wallInnerThickness,
              ]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [this.parent.width, 0]),
            ],
          };
        },
        parts: [
          ...[SensorType.lightSwitch, SensorType.temperature].map(
            (sensorType) =>
              new Sensor<Wall>({
                sensorType,
                onUpdate: function (this: Sensor<Wall>, house: House) {
                  const point = this.parent.getPosition(WallSide.in, 1, -1);
                  this.points = [
                    point,
                    mixPoints(house.serverRoom, point, false),
                    house.serverRoom,
                  ];
                },
              })
          ),
          new Sensor<Wall>({
            offset: [0, 0.3],
            sensorType: SensorType.ethernet,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const techRoom = house.serverRoom;
              const point = this.parent.getPosition(WallSide.in, 1, -1);
              this.points = [
                point,
                mixPoints(techRoom, point, false),
                techRoom,
              ];
            },
          }),
          new Door({
            scale: [1, 1],
            rotate: -90,
            onUpdate: function (this: Door, house: House) {
              this.origin = offset(
                this.parent.getPosition(WallSide.in, 1, 0),
                [0, 0]
              );
            },
          }),
        ],
      }),

      // East
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [room.width, 0]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [
                +house.wallInnerThickness,
                -house.wallInnerThickness,
              ]),
              offset(this.origin, [+house.wallInnerThickness, room.height]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [0, room.height]),
            ],
          };
        },
        parts: [],
      }),

      // South theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [room.width, room.height]);
          this.sides = {
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [room.width * -1, room.height * 0]),
            ],
          };
        },
        parts: [],
      }),

      // West theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [
            room.width * 0,
            room.height * 1,
          ]);
          this.sides = {
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [room.width * 0, room.height * -1]),
            ],
          };
        },
        parts: [],
      }),
      ...[
        ...[0, 1, 2, 3].map(
          (i) =>
            new Sensor<Room>({
              offset: [[0, 3].includes(i) ? 0.3 : -0.3, 0],
              group: 10,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Room>, house: House) {
                const room = this.parent;
                this.points = [
                  offset(room.coords[i], [0, [0, 1].includes(i) ? 1 : -1]),
                ];
              },
            })
        ),
        new Sensor<Room>({
          group: 10,
          sensorType: SensorType.socket,
          cableOnly: true,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const techRoom = house.serverRoom;
            const room = this.parent;
            const point = offset(room.coords[1], [-1, 0]);
            this.points = [
              room.coords[1],
              room.coords[2],
              room.coords[3],
              room.coords[0],
              point,
              // mixPoints(techRoom, point, false),
              // techRoom,
            ];
          },
        }),
      ],
      new SensorLight<Room>({
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

      new Vent<Room>({
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const point = offset(room.northWestCorner, [room.width / 2, 2]);
          const point2: xy = [
            room.northWestCorner[0] + room.width / 2,
            house.stramien.in.ns.b + house.balconyWidth / 2,
          ];
          this.points = [
            point,
            point2,
            mixPoints(house.serverRoom, point2, true),
            house.serverRoom,
          ];
        },
      }),
    ],
  }),
  // upper-west-three
  new Room({
    name: "upper-west-three",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const s = house.stramien;
      const height = s.in.ns.c - s.in.ns.b;
      const width = (s.in.we.b - s.in.we.a) / 3 - house.wallInnerThickness;
      this.northWestCorner = [
        s.in.we.b - (s.in.we.b - s.in.we.a) * (3 / 3),
        s.in.ns.b,
      ];
      this.squaredRoom(width, height);
    },
    parts: [
      // North theoretic
      new Wall({
        floor: Floor.top,
        type: WallType.theoretic,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          this.origin = offset(this.parent.northWestCorner, [0, 0]);
          this.sides = {
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [this.parent.width, 0]),
            ],
          };
        },
        parts: [
          new Sensor<Wall>({
            offset: [0, 0.3],
            sensorType: SensorType.ethernet,
            onUpdate: function (this: Sensor<Wall>, house: House) {
              const techRoom = house.serverRoom;
              const point = this.parent.getPosition(WallSide.in, 1, -1);
              this.points = [
                point,
                mixPoints(techRoom, point, false),
                techRoom,
              ];
            },
          }),
        ],
      }),

      // East
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [room.width, 0]);
          this.sides = {
            [WallSide.out]: [
              offset(this.origin, [+house.wallInnerThickness, 0]),
              offset(this.origin, [+house.wallInnerThickness, room.height]),
            ],
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [0, room.height]),
            ],
          };
        },
        parts: [
          ...[SensorType.lightSwitch, SensorType.temperature].map(
            (sensorType) =>
              new Sensor<Wall>({
                sensorType,
                onUpdate: function (this: Sensor<Wall>, house: House) {
                  const point = this.parent.getPosition(WallSide.in, 0, 1);
                  this.points = [
                    point,
                    mixPoints(house.serverRoom, point, false),
                    house.serverRoom,
                  ];
                },
              })
          ),
          new Door({
            scale: [1, -1],
            rotate: 0,
            onUpdate: function (this: Door, house: House) {
              this.origin = offset(
                this.parent.getPosition(WallSide.in, 0, 0),
                [0, 0]
              );
            },
          }),
        ],
      }),

      // South theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [room.width, room.height]);
          this.sides = {
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [room.width * -1, room.height * 0]),
            ],
          };
        },
        parts: [],
      }),

      // West theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          this.ceiling = house.cross.ceilingHeight;
          const room = this.parent;
          this.origin = offset(room.northWestCorner, [
            room.width * 0,
            room.height * 1,
          ]);
          this.sides = {
            [WallSide.in]: [
              offset(this.origin, [0, 0]),
              offset(this.origin, [room.width * 0, room.height * -1]),
            ],
          };
        },
        parts: [],
      }),
      ...[
        ...[0, 1, 2, 3].map(
          (i) =>
            new Sensor<Room>({
              offset: [[0, 3].includes(i) ? 0.3 : -0.3, 0],
              group: 10,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Room>, house: House) {
                const room = this.parent;
                this.points = [
                  offset(room.coords[i], [0, [0, 1].includes(i) ? 1 : -1]),
                ];
              },
            })
        ),
        new Sensor<Room>({
          group: 10,
          sensorType: SensorType.socket,
          cableOnly: true,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const techRoom = house.serverRoom;
            const room = this.parent;
            const point = offset(room.coords[1], [0, 1]);
            this.points = [
              point,
              room.coords[2],
              room.coords[3],
              room.coords[0],
              room.coords[1],
              mixPoints(techRoom, room.coords[1], true),
              techRoom,
            ];
          },
        }),
      ],
      new SensorLight<Room>({
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

      new Vent<Room>({
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const point = offset(room.northWestCorner, [room.width / 2, 2]);
          const point2: xy = [
            room.northWestCorner[0] + room.width / 2,
            house.stramien.in.ns.b + house.balconyWidth / 2,
          ];
          this.points = [
            point,
            point2,
            mixPoints(house.serverRoom, point2, true),
            house.serverRoom,
          ];
        },
      }),
    ],
  }),

  // balcony
  new Room({
    name: "balcony",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const mainBedroomSetBack = 1;
      const towerSetBack = 0.5;
      const towerSetBackWidth = 2;
      const stramien = house.stramien;
      const stair = house.stair;
      const northWall =
        house.stramien.in.ns.b -
        house.stramien.in.ns.a -
        house.tower.houseIncrement +
        house.wallInnerThickness +
        house.wallInnerThickness -
        mainBedroomSetBack;
      const hallWall =
        house.stair.stairOrigin[0] + house.stair.totalWidth + 1.0001;
      const stairWall =
        house.stramien.in.ns.b - towerSetBack + house.wallInnerThickness;
      const stairWallShort =
        house.tower.innerCoords[3][0] -
        towerSetBackWidth +
        house.wallInnerThickness;
      const stairPoint = offset(stair.stairOrigin, [
        stair.totalWidth,
        stair.totalHeight,
      ]);
      const balconyEdge = stramien.in.ns.b + house.balconyWidth;
      const lastRoom =
        stramien.in.we.a + (stramien.in.we.b - stramien.in.we.a) * (1 / 3);
      this.coords = [
        offset(stairPoint, [-stair.walkWidth, 0]),
        stairPoint,
        [stairPoint[0], northWall],
        [hallWall, northWall],
        [hallWall, stramien.in.ns.b],
        [stairWallShort, stramien.in.ns.b],
        [stairWallShort, stairWall],
        [stramien.in.we.c, stairWall],
        [house.tower.innerCoords[3][0], stairWall],
        [house.tower.innerCoords[3][0], stramien.in.ns.b],
        [stramien.in.we.d, stramien.in.ns.b],
        [stramien.in.we.d, balconyEdge],
        [house.tower.innerCoords[3][0], balconyEdge],
        offset([stramien.in.we.c, balconyEdge], [0, 0]),
        offset([stramien.in.we.c, balconyEdge], [0, house.balconyEdge]),
        offset([stramien.in.we.b, balconyEdge], [0, house.balconyEdge]),
        offset([stramien.in.we.b, balconyEdge], [0, 0]),
        [lastRoom, balconyEdge],
        [lastRoom, stramien.in.ns.b],
        [stairPoint[0] - stair.walkWidth, stramien.in.ns.b],
      ];
    },
    parts: [
      new Sensor<Room>({
        offset: [0, 0.3],
        sensorType: SensorType.pir,
        onUpdate: function (this: Sensor<Room>, house: House) {
          const techRoom = house.serverRoom;
          const point: xy = [
            house.stramien.in.we.b +
              (house.stramien.in.we.c - house.stramien.in.we.b) / 2,
            house.stramien.in.ns.b,
          ];
          this.points = [
            offset(point, [-house.wallInnerThickness, 0]),
            mixPoints(techRoom, point, true),
            techRoom,
          ];
        },
      }),
      ...[SensorType.smoke, SensorType.poe, SensorType.wifi].map(
        (sensorType, i) =>
          new Sensor<Room>({
            offset: [0, sensorType === SensorType.smoke ? -1 : 0.3],
            sensorType,
            onUpdate: function (this: Sensor<Room>, house: House) {
              const techRoom = house.serverRoom;
              const point: xy = [
                house.stramien.in.we.b +
                  (house.stramien.in.we.c - house.stramien.in.we.b) / 2,
                house.stramien.in.ns.b,
              ];
              this.points = [
                offset(point, [-house.wallInnerThickness, 0]),
                mixPoints(techRoom, point, true),
                techRoom,
              ];
            },
          })
      ),

      new Sensor<Room>({
        offset: [0, 0.3],
        group: 10,
        sensorType: SensorType.socket,
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const xy = [house.stramien.in.we.b, house.stramien.in.ns.b] as xy;
          this.points = [offset(xy, [-1, 0])];
        },
      }),
      new Sensor<Room>({
        offset: [0, 0.3],
        group: 10,
        sensorType: SensorType.socket,
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const xy = [house.stramien.in.we.c, house.stramien.in.ns.b] as xy;
          this.points = [offset(xy, [0, 0])];
        },
      }),
      new SensorLight<Room>({
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const point = offset(room.coords[0], [1, 0]);
          this.points = [
            point,
            mixPoints(house.serverRoom, point, false),
            house.serverRoom,
          ];
        },
      }),
    ],
  }),

  // Void
  new Room({
    name: "void",
    floor: Floor.top,
    hole: true,
    onUpdate: function (this: Room, house: House) {
      const northWestCorner: [number, number] = [
        house.stramien.in.we.b,
        house.stramien.in.ns.b + house.balconyWidth + house.balconyEdge,
      ];
      const height = house.stramien.in.ns.d - northWestCorner[1];
      const width = house.stramien.in.we.c - house.stramien.in.we.b;
      this.coords = [
        northWestCorner,
        offset(northWestCorner, [width * 1, height * 0]),
        offset(northWestCorner, [width * 1, height * 1]),
        offset(northWestCorner, [width * 0, height * 1]),
      ];
    },
  }),

  // Void
  new Room({
    name: "voidStairs",
    floor: Floor.top,
    hole: true,
    onUpdate: function (this: Room, house: House) {
      const s = house.stair;
      this.northWestCorner = s.stairOrigin;
      const height =
        house.stramien.in.ns.b -
        s.stairOrigin[1] -
        2 -
        house.wallInnerThickness * 3;
      const width = s.totalWidth;
      this.coords = [
        this.northWestCorner,
        offset(this.northWestCorner, [width - s.walkWidth, 0]),
        offset(this.northWestCorner, [width - s.walkWidth, height]),
        // offset(this.northWestCorner, [width, s.totalHeight]),
        // offset(this.northWestCorner, [width-s.walkWidth, s.totalHeight]),
        // offset(this.northWestCorner, [width-s.walkWidth, height]),
        offset(this.northWestCorner, [0, height]),
      ];
    },
    parts: [
      new SensorLight<Room>({
        onUpdate: function (this: Sensor<Room>, house: House) {
          const room = this.parent;
          const point = offset(room.northWestCorner, [
            house.stair.totalWidth / 2,
            1,
          ]);
          this.points = [
            point,
            mixPoints(house.serverRoom, point, false),
            house.serverRoom,
          ];
        },
      }),
    ],
  }),
];

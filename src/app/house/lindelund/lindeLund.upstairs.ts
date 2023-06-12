import { Polygon } from "ol/geom";
import { Floor, SensorType } from "src/app/components/enum.data";
import { AppPolygon } from "src/app/model/polygon.model";
import { Door } from "src/app/house-parts/door.model";
import { Room } from "src/app/house-parts/room.model";
import { Sensor } from "src/app/model/specific/sensors/sensor.model";
import { SensorLight } from "src/app/model/specific/sensors/sensorLight.model";
import { Vent } from "src/app/model/specific/sensors/vent.model";
import { Water } from "src/app/model/specific/sensors/water.model";
import {
  CornerType,
  Wall,
  WallSide,
  WallType,
} from "src/app/house-parts/wall.model";
import { Window, WindowForm } from "src/app/house-parts/window.model";
import {
  distanceBetweenPoints,
  mixPoints,
  offset,
  round,
} from "src/app/shared/global-functions";
import { House, xy } from "../house.model";

export const lindeLundUpstairs = [
  // toilet upstairs
  new Room({
    name: "Toilet-upstairs",
    function: "WC",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const height = 1.0;
      const width =
        house.stramien.top.we.toilet -
        house.stramien.in.we.b -
        house.wallInnerThickness;

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
    function: "KLK2",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const height = 1.0;
      const width =
        house.stramien.top.we.toilet -
        house.stramien.in.we.b -
        house.wallInnerThickness;
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
    function: "Sovrum 1",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      this.northWestCorner = [house.stramien.in.we.b, house.stramien.in.ns.a];
      this.width = round(house.stramien.in.we.c - house.stramien.in.we.b);
      this.height = round(house.stramien.top.ns.hall - house.stramien.in.ns.a);

      this.center = offset(this.northWestCorner, [
        this.width / 2,
        this.height / 2,
      ]);
      this.centralElectricity = this.center;

      const midX = house.stair.totalWidth + house.wallInnerThickness;
      const midY =
        house.stramien.ground.ns.hall -
        house.wallInnerThickness -
        this.northWestCorner[1];

      this.coords = [
        this.northWestCorner,
        offset(this.northWestCorner, [this.width, 0]),
        offset(this.northWestCorner, [this.width, this.height]),
        offset(this.northWestCorner, [midX, this.height]),
        offset(this.northWestCorner, [midX, midY]),
        offset(this.northWestCorner, [0, midY]),
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
          this.innerWallLength = distanceBetweenPoints(
            room.coords[3],
            room.coords[2]
          );
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
          this.innerWallLength = distanceBetweenPoints(
            room.coords[4],
            room.coords[3]
          );

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
          this.innerWallLength = distanceBetweenPoints(
            room.coords[5],
            room.coords[4]
          );
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
    function: "Badrum",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const towerSetBack = 0.5;
      const towerSetBackWidth = 2;
      const northWall = house.stramien.top.ns.hall + house.wallInnerThickness;
      const hallWall = house.stramien.top.we.hall + house.wallInnerThickness;
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
          this.innerWallLength = distanceBetweenPoints(
            room.coords[5],
            room.coords[6]
          );
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
            size: 50,
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
          this.innerWallLength = distanceBetweenPoints(
            room.coords[6],
            room.coords[7]
          );
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
          this.innerWallLength = distanceBetweenPoints(
            room.coords[7],
            room.coords[8]
          );
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
          this.innerWallLength = distanceBetweenPoints(
            room.coords[8],
            room.coords[0]
          );
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
    function: "Sovrum 2",
    name: "Upper-east",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const s = house.stramien;
      const wall = house.wallInnerThickness;

      const width = s.in.we.d - s.in.we.c - wall;
      const height = s.in.ns.c - s.top.ns.walkway - wall;
      this.northWestCorner = [s.in.we.c + wall, s.top.ns.walkway + wall];
      const width2 = s.in.we.c - s.top.we.hall;
      const height2 =
        s.in.ns.c +
        house.balconyEdge -
        house.balconyDepth -
        this.northWestCorner[1];
      this.coords = [
        this.northWestCorner,
        offset(this.northWestCorner, [width, 0]),
        offset(this.northWestCorner, [width, height]),
        offset(this.northWestCorner, [0, height]),
      ];

      if (house.eastRoomExtended) {
        this.coords.push(
          ...[
            offset(this.northWestCorner, [0, height2]),
            offset(this.northWestCorner, [-width2, height2]),
            offset(this.northWestCorner, [-width2, 0]),
          ]
        );
      }
      this.center = offset(this.northWestCorner, [width / 2, height / 2]);
      this.centralElectricity = this.center;
    },
    parts: [
      // North
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          let i = 6;
          let j = 1;
          if (!house.eastRoomExtended) {
            i = 0;
            j = 1;
          }
          this.drawByRoom(i, j, house, CornerType.outside, CornerType.straight);
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
          let i = 1;
          let j = 2;
          if (!house.eastRoomExtended) {
            i = 1;
            j = 2;
          }
          this.drawByRoom(
            i,
            j,
            house,
            CornerType.straight,
            CornerType.straight
          );
        },
      }),
      // South theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          let i = 2;
          let j = 3;
          if (!house.eastRoomExtended) {
            i = 2;
            j = 3;
          }
          this.drawByRoom(
            i,
            j,
            house,
            CornerType.straight,
            CornerType.straight
          );
        },
      }),
      // west hall
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          let i = 3;
          let j = 4;
          let c = CornerType.inside;
          if (!house.eastRoomExtended) {
            i = 3;
            j = 0;
            c = CornerType.outside;
          }
          this.drawByRoom(i, j, house, CornerType.straight, c);
        },
      }),

      // mid
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          let i = 4;
          let j = 5;
          if (!house.eastRoomExtended) {
            this.visible = false;
          }
          this.drawByRoom(i, j, house, CornerType.inside, CornerType.outside);
        },
      }),
      // west 2
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          let i = 5;
          let j = 6;
          if (!house.eastRoomExtended) {
            this.visible = false;
          }
          this.drawByRoom(i, j, house, CornerType.outside, CornerType.outside);
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

  // mid
  new Room({
    function: "Sovrum 3",
    name: "upper-mid",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const s = house.stramien;
      const wall = house.wallInnerThickness;
      const height = s.in.ns.c - s.top.ns.walkway - wall;
      const width = s.in.we.b - s.in.we.a - house.westRoomWidth - wall * 2;

      this.northWestCorner = [
        s.in.we.a + house.westRoomWidth + wall,
        s.top.ns.walkway + wall,
      ];

      const height2 =
        s.in.ns.c +
        house.balconyEdge -
        house.balconyDepth -
        this.northWestCorner[1];
      const width2 = s.top.we.toilet - this.northWestCorner[0] - wall;

      if (house.midRoomExtended) {
        this.coords = [
          this.northWestCorner,
          offset(this.northWestCorner, [width2, 0]),
          offset(this.northWestCorner, [width2, height2]),
          offset(this.northWestCorner, [width, height2]),
          offset(this.northWestCorner, [width, height]),
          offset(this.northWestCorner, [0, height]),
        ];
      } else {
        this.coords = [
          this.northWestCorner,
          offset(this.northWestCorner, [width, 0]),
          offset(this.northWestCorner, [width, height]),
          offset(this.northWestCorner, [0, height]),
        ];
      }

      this.center = offset(this.northWestCorner, [width / 2, height / 2]);
      this.centralElectricity = this.center;
    },
    parts: [
      // North
      new Wall({
        floor: Floor.top,
        type: WallType.inner,
        onUpdate: function (this: Wall, house: House) {
          this.drawByRoom(0, 1, house, CornerType.straight, CornerType.outside);
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
          this.drawByRoom(1, 2, house, CornerType.outside, CornerType.outside);
        },
        parts: [],
      }),

      // Mid
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          if (!house.midRoomExtended) {
            this.visible = false;
          }
          this.drawByRoom(2, 3, house, CornerType.outside, CornerType.inside);
        },
        parts: [],
      }),
      // East south
      new Wall({
        type: WallType.inner,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          if (!house.midRoomExtended) {
            this.visible = false;
          }
          this.drawByRoom(3, 4, house, CornerType.inside, CornerType.straight);
        },
        parts: [],
      }),

      // South theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          let i = 4;
          let j = 5;
          if (!house.midRoomExtended) {
            i = 2;
            j = 3;
          }
          this.drawByRoom(
            i,
            j,
            house,
            CornerType.straight,
            CornerType.straight
          );
        },
        parts: [],
      }),

      // West theoretic
      new Wall({
        type: WallType.theoretic,
        floor: Floor.top,
        onUpdate: function (this: Wall, house: House) {
          let i = 5;
          let j = 0;
          if (!house.midRoomExtended) {
            i = 3;
            j = 0;
          }
          this.drawByRoom(
            i,
            j,
            house,
            CornerType.straight,
            CornerType.straight
          );
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
  // west
  new Room({
    function: "Sovrum 3",
    name: "upper-west",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const s = house.stramien;
      const width = house.westRoomWidth;
      this.northWestCorner = [s.in.we.a, s.in.ns.b];
      this.squaredRoom(width, s.in.ns.c - this.northWestCorner[1]);
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

  // hall
  new Room({
    name: "hall-walkway",
    function: "Passage",
    floor: Floor.top,
    onUpdate: function (this: Room, house: House) {
      const s = house.stramien;
      const wall = house.wallInnerThickness;

      const stairsEndXY = [
        s.in.we.b + house.stair.totalWidth,
        s.ground.ns.hall + house.stair.totalHeight,
      ] as xy;

      const balconySouth = s.in.ns.c + house.balconyEdge;
      const balconyNorth = balconySouth - house.balconyDepth + wall;

      this.coords = [
        [s.in.we.a + house.westRoomWidth + wall, s.in.ns.b],
        [s.top.we.toilet, s.in.ns.b],
        [s.top.we.toilet, stairsEndXY[1]],
        stairsEndXY,
        [stairsEndXY[0], s.top.ns.hall],
        [s.top.we.hall, s.top.ns.hall],
        [s.top.we.hall, s.in.ns.b],
        //todo tower
        [s.in.we.d, s.in.ns.b],
        [s.in.we.d, s.top.ns.walkway],
        [s.in.we.c, s.top.ns.walkway],
      ];

      if (house.eastRoomExtended) {
        this.coords.push(
          ...([
            [s.top.we.hall, s.top.ns.walkway],
            [s.top.we.hall, balconyNorth],
            [s.in.we.c, balconyNorth],
          ] as xy[])
        );
      }

      this.coords.push(
        ...([
          [s.in.we.c, balconySouth],
          [s.in.we.b, balconySouth],
        ] as xy[])
      );

      if (house.midRoomExtended) {
        this.coords.push(
          ...([
            [s.in.we.b, balconyNorth],
            [s.top.we.toilet, balconyNorth],
            [s.top.we.toilet, s.top.ns.walkway],
          ] as xy[])
        );
      }
      this.coords.push(
        ...([
          [s.in.we.b, s.top.ns.walkway],
          [s.in.we.a + house.westRoomWidth + wall, s.top.ns.walkway],
        ] as xy[])
      );
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
        house.stramien.in.ns.c + house.balconyEdge,
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

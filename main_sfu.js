const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;

const token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60 * 24,
    scope: {
      app: {
        id: "bc316c89-7083-405a-91e3-608853256508",
        turn: true,
        actions: ["read"],
        channels: [
          {
            id: "*",
            name: "*",
            actions: ["write"],
            members: [
              {
                id: "*",
                name: "*",
                actions: ["write"],
                publication: {
                  actions: ["write"],
                },
                subscription: {
                  actions: ["write"],
                },
              },
            ],
            sfuBots: [
              {
                actions: ["write"],
                forwardings: [
                  {
                    actions: ["write"],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  }).encode("xM1kqR0CCU987dwnmAJhigK2W5bxhganB410bZPBVCY=");

  (async () => {
    // 1
    const buttonArea = document.getElementById("button-area");
    const remoteMediaArea = document.getElementById("remote-media-area");
    let roomNameInput = document.getElementById("room-name");
    const myId = document.getElementById("my-id");
    const joinButton = document.getElementById("join");
    const leaveButton = document.getElementById('leave');

    const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream(); // 2
  
    

    joinButton.onclick = async () => {

        if (roomNameInput === "") return;
      
        const context = await SkyWayContext.Create(token);
        const room = await SkyWayRoom.FindOrCreate(context, {
            type: "sfu",
            //name: roomNameInput,
            name: "12345",
        });
    
        const me = await room.join();
    
        myId.textContent = me.id;
    
        const subscribeAndAttach = (publication) => {
            if (publication.publisher.id === me.id) return;
      
            const subscribeButton = document.createElement("button");
            subscribeButton.id = `subscribe-button-${publication.id}`;
            subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
            buttonArea.appendChild(subscribeButton);
      
            document.getElementById(subscribeButton.id).click();

            subscribeButton.onclick = async () => {
              const { stream } = await me.subscribe(publication.id);
      
              let newMedia;
              switch (stream.track.kind) {
                case "video":
                  newMedia = document.createElement("video");
                  newMedia.playsInline = true;
                  newMedia.autoplay = true;
                  break;
                case "audio":
                  newMedia = document.createElement("audio");
                  newMedia.controls = true;
                  newMedia.autoplay = true;
                  break;
                default:
                  return;
              }
              newMedia.id = `media-${publication.id}`;
              stream.attach(newMedia);
              remoteMediaArea.appendChild(newMedia);
            };
        };

        room.publications.forEach(subscribeAndAttach);
        room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));

        leaveButton.onclick = async () => {
            await me.leave();
            await room.dispose();
      
            myId.textContent = "";
            buttonArea.replaceChildren();
            remoteMediaArea.replaceChildren();
        };

        room.onStreamUnpublished.add((e) => {
            document.getElementById(`subscribe-button-${e.publication.id}`)?.remove();
            document.getElementById(`media-${e.publication.id}`)?.remove();
        });

    };

  })(); // 1




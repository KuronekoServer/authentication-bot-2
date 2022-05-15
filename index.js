const { Client, Intents, MessageActionRow, MessageSelectMenu, MessageButton, MessageAttachment, Permissions } = require('discord.js');
const { Modal, TextInputComponent, showModal } = require('discord-modals');
const Canvas = require('canvas');
const discordModals = require('discord-modals');
const fs = require("node:fs");
const slashs = require("./slash.json");
const config = require("./config.json");
const BitlyClient = require('bitly').BitlyClient;
const bitly = new BitlyClient(config.bitly);
const write = data => {
  const datas = require("./data.json");
  guildId = data.gd;
  const tmp = new Object();
  if (!datas.some(() => guildId)) {
    tmp[guildId] = data.options;
    datas.push(tmp)
    this.writedata = datas
  } else {
    let i = 0;
    datas.splice([datas.map(x => {
      if (x[guildId]) return i
      i++
    })[0]]);
    tmp[guildId] = data.options;
    datas.push(tmp)
    this.writedata = datas
  };
  fs.writeFileSync('./data.json', JSON.stringify(this.writedata, null, 2), 'utf8')
};
const code_type = { "number": "数字", "number_alp": "英数字", "alp": "英字" }
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS]
});
discordModals(client);
/*   各宣言　　　*/
const image_button_back_modal = new Modal()
  .setCustomId('modal_image_back')
  .setTitle('画像URLを入力してください')
  .addComponents(
    new TextInputComponent()
      .setCustomId('textinput_image_back')
      .setLabel('注:画像URLは短縮URLに自動で変換されます\nご了承ください')
      .setStyle('SHORT')
      .setPlaceholder('ここに入力')
      .setRequired(true)
  );
const image_button_message_modal = new Modal()
  .setCustomId('modal_image_message')
  .setTitle('生成メッセージを入力(1000字以内)')
  .addComponents(
    new TextInputComponent()
      .setCustomId('textinput_image_message')
      .setLabel('認証ユーザーのDMに送るメッセージです')
      .setStyle('LONG')
      .setMaxLength(1000)
      .setPlaceholder('ここに入力')
      .setRequired(true)
  );
const image_button_start_modal = new Modal()
  .setCustomId('modal_image_start')
  .setTitle('生成メッセージを入力(2000字以内)')
  .addComponents(
    new TextInputComponent()
      .setCustomId('textinput_image_start')
      .setLabel('ボタンを作成する際のメッセージです')
      .setStyle('LONG')
      .setMaxLength(2000)
      .setPlaceholder('ここに入力')
      .setRequired(true)
  );
const image_button = new MessageActionRow()
  .addComponents(
    new MessageButton()
      .setCustomId('image_button_back')
      .setLabel('背景画像変更')
      .setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId('image_button_message')
      .setLabel('認証後のメッセージ変更')
      .setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId('image_button_start')
      .setLabel('作成')
      .setStyle('PRIMARY')
  );
const image_select = new MessageActionRow()
  .addComponents(
    new MessageSelectMenu()
      .setCustomId('select_code_type')
      .setPlaceholder('数字')
      .addOptions([
        {
          label: '数字',
          description: '生成コードを数字にします',
          value: 'number',
        },
        {
          label: '英数字',
          description: '生成コードを英数字にします',
          value: 'number_alp',
        },
        {
          label: '英字',
          description: '生成コードを英字にします',
          value: 'alp',
        },
      ]),
  );
const image_start = new MessageActionRow()
  .addComponents(
    new MessageButton()
      .setCustomId('image_button_auth')
      .setLabel('認証')
      .setStyle('PRIMARY'),
  );

/*  イベント開始   */
client.on('ready', async () => {
  client.user.setActivity(`導入数 ${client.guilds.cache.size} `, {
    type: 'PLAYING',
  });
  await client.application.commands.set(slashs, config.slashserver);
  console.log("処理が完了しました")
});
client.on("interactionCreate", async interaction => {
  /*  サーバー以外でのコマンドは無視  */
  if (!interaction.guild) return interaction.reply({
    embeds: [{
      title: "エラー",
      description: "DMではできないです",
      color: 0xff1100
    }],
  });
  /*  メッセージ送信権限がなかったら処理中断  */
  if (!interaction.guild.me.permissionsIn(interaction.channel).has("2048")) return;
  /*   メイン   */
  if (interaction.isCommand()) {
    if (interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return interaction.reply({
      embeds: [{
        title: "エラー",
        color: 0xff1100,
        description: "あなたには管理者権限がありません。"
      }],
      ephemeral: true
    });
    const role = interaction.options.getRole("role").id;
    const type = interaction.options.getString("option");
    if (!interaction.guild.me.permissionsIn(interaction.channel).has("268435456")) return interaction.reply({
      embeds: [{
        title: "エラー",
        color: 0xff1100,
        description: "ロールをつける権限がありません。"
      }],
      ephemeral: true
    });

    /*   web認証    */
    if (type == "web") {
      interaction.reply({
        embeds: [{
          title: "エラー",
          color: 0xff1100,
          description: "まだ実装されていません"
        }],
        ephemeral: true
      });
    };
    /*   画像認証    */
    if (type == "image") {
      interaction.guild.me.roles.add(role)
        .catch(() => {
          interaction.reply({
            embeds: [{
              title: "エラー",
              color: 0xff1100,
              description: "ロール権限がBOTよりも上です"
            }],
            ephemeral: true
          })
        })
        //画像操作画面
        .then(data => {
          if (!data) return;
          interaction.guild.me.roles.remove(role).catch(() => { })
          write({ gd: interaction.guildId, options: { btms: null, btbk: null, ath: "number", role: role } });
          interaction.reply({
            embeds: [{
              color: 0x00ff22,
              title: "画像認証コントロール画面",
              description: `背景:デフォルト\n生成コード:数字\n認証後のメッセージ:なし`
            }],
            components: [image_button, image_select],
            ephemeral: true
          });
        });
    };
    /*   パスワード認証    */
    if (type == "password") {
      interaction.reply({
        embeds: [{
          title: "エラー",
          color: 0xff1100,
          description: "まだ実装されていません"
        }],
        ephemeral: true
      });
    };
    /*   インプットテキスト認証    */
    if (type == "input") {
      interaction.reply({
        embeds: [{
          title: "エラー",
          color: 0xff1100,
          description: "まだ実装されていません"
        }],
        ephemeral: true
      });
    }
  };
  /*  ボタン  */
  if (interaction.isButton()) {
    if (interaction.customId == "image_button_back") {
      showModal(image_button_back_modal, {
        client: client,
        interaction: interaction
      });
    };
    if (interaction.customId == "image_button_message") {
      showModal(image_button_message_modal, {
        client: client,
        interaction: interaction
      });
    };
    if (interaction.customId == "image_button_start") {
      showModal(image_button_start_modal, {
        client: client,
        interaction: interaction
      });
    };
    if (interaction.customId == "image_button_auth") {
      await interaction.deferReply({ ephemeral: true })
      let tmp;
      const datas = require("./data.json");
      const data = datas.filter(x => Object.keys(x)[0] == interaction.guildId)[0][interaction.guildId];
      if (data.ath == "number") tmp = "123456789"
      if (data.ath == "number_alp") tmp = "abcdefghjkmnpqrstuvwxyzABCDEFZHIJKLMNOPQRSTUVWXYZ1234567890"
      if (data.ath == "alp") tmp = "abcdefghjkmnpqrstuvwxyzABCDEFZHIJKLMNOPQRSTUVWXYZ"
      const password = Array.from(Array(6)).map(() => tmp[Math.floor(Math.random() * tmp.length)]).join('');
      const canvas = Canvas.createCanvas(700, 250);
      const context = canvas.getContext('2d');
      let background = await Canvas.loadImage(data.btbk || "https://beiz.jp/images_S/black/black_00070.jpg").catch(() => { });
      if (!background) background = await Canvas.loadImage("https://beiz.jp/images_S/black/black_00070.jpg");
      context.drawImage(background, 0, 0, canvas.width, canvas.height);
      context.strokeRect(0, 0, canvas.width, canvas.height);
      context.font = '60px sans-serif';
      context.fillStyle = '#ffffff';
      context.fillText(password, canvas.width / 2.5, canvas.height / 1.8);
      const attachment = new MessageAttachment(canvas.toBuffer(), 'auth.png');
      const image_auth = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(`image_button_auth_user,${password}`)
            .setLabel('認証')
            .setStyle('PRIMARY'),
        );
      interaction.followUp({ files: [attachment], components: [image_auth], ephemeral: true });
    };
    if (interaction.customId.startsWith("image_button_auth_user")) {
      const password = interaction.customId.split(",")[1]
      const image_button_auth_modal = new Modal()
        .setCustomId(`modal_image_check,${password}`)
        .setTitle('パスワードを入力')
        .addComponents(
          new TextInputComponent()
            .setCustomId(`image_check`)
            .setLabel('パスワードを入力してください')
            .setStyle('SHORT')
            .setMinLength(6)
            .setMaxLength(6)
            .setPlaceholder('ここに入力')
            .setRequired(true)
        );
      showModal(image_button_auth_modal, {
        client: client,
        interaction: interaction
      });
    }
  };
  /*   セレクトメニュー   */
  if (interaction.isSelectMenu()) {
    if (interaction.customId == "select_code_type") {
      const type = interaction.values[0];
      await interaction.deferReply({ ephemeral: true });
      const datas = require("./data.json");
      const data = datas.filter(x => Object.keys(x)[0] == interaction.guildId)[0][interaction.guildId];
      write({ gd: interaction.guildId, options: { btms: data.btms || null, btbk: data.btbk, ath: type, role: data.role } });
      interaction.followUp({
        embeds: [{
          color: 0x00ff22,
          title: "画像認証コントロール画面",
          description: `背景:${data.btms || "デフォルト"}\n生成コード:${code_type[type]}\n認証後のメッセージ:${data.btms || "なし"}`
        }],
        components: [image_button, image_select],
        ephemeral: true
      });
    };
  }
});
client.on("modalSubmit", async modal => {
  await modal.deferReply({ ephemeral: true });
  const datas = require("./data.json");
  const data = datas.filter(x => Object.keys(x)[0] == modal.guildId)[0][modal.guildId];
  if (modal.customId === 'modal_image_back') {
    const url = modal.getTextInputValue('textinput_image_back');
    const response = await bitly.shorten(url).catch(() => { });
    if (!response) return modal.followUp({
      embeds: [{
        color: 0xff1100,
        title: "エラー",
        description: "URLではありません"
      }],
      ephemeral: true
    });
    write({ gd: modal.guildId, options: { btms: data.btms || null, btbk: response.link, ath: data.ath, role: data.role } });
    modal.followUp({
      embeds: [{
        color: 0x00ff22,
        title: "画像認証コントロール画面",
        description: `背景:${response.link || "デフォルト"}\n生成コード:${code_type[data.ath]}\n認証後のメッセージ:${data.btms || "なし"}`
      }],
      components: [image_button, image_select],
      ephemeral: true
    });
  };
  if (modal.customId === 'modal_image_message') {
    const message = modal.getTextInputValue('textinput_image_message');
    write({ gd: modal.guildId, options: { btms: message || null, btbk: data.btbk || null, ath: data.ath, role: data.role } });
    modal.followUp({
      embeds: [{
        color: 0x00ff22,
        title: "画像認証コントロール画面",
        description: `背景:${data.btbk || "デフォルト"}\n生成コード:${code_type[data.ath]}\n認証後のメッセージ:${message || "なし"}`
      }],
      components: [image_button, image_select],
      ephemeral: true
    });
  };
  if (modal.customId == "modal_image_start") {
    modal.followUp({
      embeds: [{ title: "作成に成功しました", color: 0x00ff22 }]
    })
    modal.channel.send({
      embeds: [{
        title: "認証",
        description: modal.getTextInputValue('textinput_image_start'),
        color: 0x00ff22
      }],
      components: [image_start]
    });
  };
  if (modal.customId.startsWith("modal_image_check")) {
    const input = modal.getTextInputValue('image_check');
    const check = modal.customId.split(",")[1]
    if (input == check) {
      modal.member.roles.add(data.role)
        .catch(() => {
          modal.followUp({
            embeds: [{
              color: 0xff1100,
              title: "エラー",
              description: "BOTの権限が足りないです"
            }]
          });
        })
        .then(data => {
          if (!data) return;
          modal.followUp({
            embeds: [{
              color: 0x00ff22,
              title: "成功",
              description: data.btms || "認証に成功しました"
            }]
          });
        })
    } else {
      modal.followUp({
        embes: [{
          color: 0xff1100,
          title: "間違っています",
          ephemeral: true
        }]
      })
    }
  }
});
client.login(config.token)

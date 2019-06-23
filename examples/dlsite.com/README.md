# ファイルの作成例
## これは何？
サウンドノベルのスクリプトファイルの例です。
DLsiteさんの公式作品で、無料で配られている物を対象としています。

## 準備
1. DLsiteさんから作品をダウンロード（購入）します。
次のいずれかをダウンロードします。
- メイドと暮らそ♪くるみちゃんと一緒【バイノーラル】 https://www.dlsite.com/maniax/work/=/product_id/RJ243414.html
- 幼馴染とドキドキ押し入れナイト!?in修学旅行【バイノーラル】https://www.dlsite.com/maniax/work/=/product_id/RJ243448.html
- 後輩彼女、ゆずきと癒されおうちデート♪～ドキドキ耳かきサロンごっこ～【バイノーラル】https://www.dlsite.com/home/work/=/product_id/RJ254160.html
2. 自分の環境に展開します。ここでは、仮に/home/test/に展開することにします。
3. このフォルダにある".snv"ファイルを/home/testに展開します。ディレクトリ構成は次のとおりになります。
```
 +--home
   +--test
     +--RJ243414.snv
     +--RJ243448.snv
     +--RJ254160.snv
     +--メイドと暮らそ♪くるみちゃんと一緒
     +--幼馴染とドキドキ押し入れナイト!?in修学旅行
     +--後輩彼女、ゆずきと癒されおうちデート♪
```

## 作品を上演する
1. requirements.txtを使ってpipで関連するモジュールをインストールしてください。
2. ffmpegが必要になるので、ffmpegをインストールしてください。
3. soundnovel.shとsoundnovel.pyを同じディレクトリに置き、関連するモジュールをその下に置きます。ここでは、/home/test2とします。
```
 +--home
   +--test2
     +--soundnovel.sh
     +--soundnovel.py
     +--Media
       +--*.py
     +--requirements.txt
```
4. 次のコマンドで実行します。
```
 $ /home/test2/soundnovel.sh /home/test/RJ243414.snv
```

## その他
.snvファイルをMIMEに登録して、soundnovel.shを関連付けて起動するようになると色々と楽になります。

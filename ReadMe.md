![](/resources/client/logo.png?raw=true)

# easychess

Chess interface.

## About easychess

Easy Chess is a chess interface that supports variants Standard, Atomic and S-Chess. 

Easy Chess offers new ideas for searching and analyzing your lichess games.

It runs in the Heroku cloud:

[Easy Chess online](https://easychess.herokuapp.com)

It is open source under the MIT license:

[Source on GitHub](https://github.com/easychessanimations/easychess)

[Source on GitLab](https://gitlab.com/easychessanimations/easychess)

## Install locally

```
git clone https://github.com/easychessanimations/easychess.git
cd easychess
npm install
```

## Run server locally

Start the server using the below platform specific instructions, then visit:

[http://localhost:3000](http://localhost:3000)

### Start server on Windows

```
sw\sl
```

### Start server on Linux

```
chmod a+x sh/*
bash sh/sl.sh
```

## Variant quick start

In the `Settings` tab select the desired variant:

![](https://i.imgur.com/myqKjmf.png)

Under the board press the leftmost red button:

![](https://i.imgur.com/aldbCzc.png)

In the dialog box that pops up type `reset` :

![](https://i.imgur.com/2HMp7au.png)

You should get a confirmation message.

## Import PGN quick start

To import a PGN initiating from the starting position, navigate to the starting position using the blue `<<` button under the board, then in `Tools / Multi PGN` tab paste the PGN into the text box.

*This is a merge operation, so the PGN will be merged into the existing study.*

## Import PGN / FEN advanced

### Merge PGN with custom starting position

To import a PGN initiating from a custom position, navigate the study to a position that matches the starting FEN of the PGN, then in `Tools / Multi PGN` tab paste the PGN into the text box.

*Looking up the position with the right FEN cannot be made automatic, because several transpositions can result in a position with the same FEN, so it is a user decision where to merge the PGN.*

### Set study from PGN

To set the study from a PGN, go to `Tools / FEN` and paste the PGN into the `Reset from this PGN` text box. This will delete the entire study and build it from the PGN. If necessary, the variant will be changed to that of the PGN.

### Set study from FEN

To set the study from a FEN, go to `Tools / FEN` and paste the PGN into the `Reset from this FEN` text box. This will delete the entire study and set it as a single position described by the FEN. The variant will be the current variant.

### Export and import game

To export a game visit

[Tools / MultiPGN](https://easychess.herokuapp.com/?ubertab=analyze&tab=tools/multiPGN)

and press "Export game" .

An import url will be generated and you will be redirected to this import url.

Bookmark the redirected page, or copy its url from the browser's address bar so that you can share it.

There is no catalogue of the exported games; if you forget the url ( game ID ), it is practically lost for you, so make sure you bookmark or share the game right after exporting.

## New ideas

I created chess interfaces before, but this one has new ideas and is built on a completely different basis than the former ones.

Most importanlty it does not require server attention for move generation and storing the game state. 

Move generation is done in the client with a Javascript chessboard that I developed from scratch ( I'm aware of [scalachess.js](https://github.com/veloce/scalachessjs), which is the lichess Scala chess library translated into Javascript, but this is a very large file, it is asynchronous and does not have all the functions I need ).

For storage it uses indexedDB, which is an in browser database that offers practically unlimited storage space ( depending on implementation it may prompt you for approval if it exceeds a certain storage limit ). This is an improvement over localStorage that is limited to 5 MB in most implementations and cannot grow. You can save the whole application state to a local file and restore from there by dragging the file into the browser window.

The app can be linked to your lichess account using oauth. It only accesses your public lichess profile data. To log in, in the Auth tab press Login with lichess button.

Once linked to a lichess account, the application slowly builds up a database of your lichess games. On every login it updates the database with your new games. Lost games are marked with a "*", unexpected draws with a "?". Color is taken into account in determining what counts as an unexpected draw.

![](https://i.imgur.com/Wr2IiJt.png)

You can create filters to filter your games. This is a powerful feature, because you don't have to specify your search criteria from scratch every time.

![](https://i.imgur.com/9vEtEvC.png)

The above example is a filter for high rated opponents. The filter logic is a piece of Javascript code, that returns a boolean value for every lichess game.

The game can be referenced in the code as "lg", which is a LichessGame class wrapper around the JSON representation supplied by lichess.

You have to study the source code to know what fields of this class has:

[LichessGame](https://github.com/easychessanimations/easychess/blob/master/resources/client/js/lichess.js#L135)

LichessGame class has two advantages over raw lichess JSON representation. It calculates digested fields ( for example result in a numerical form ), but more importantly it has context, namely it is relative to your username. So rather than white won or black won, it tells you whether you or your opponent won, rather than white rating and black rating, it tells you your own and your opponent's rating etc.

In the example I created the logic with the code  "lg.opponentRating > 2200", which will use the LichessGame class' "opponentRating" field to determine whether the game should be included in the filter.

Having to write a code may seem unfriendly, but it removes the need for filling an excessive form and also gives your complete freedom. You can search any complex criteria you can think of that can be searched based on the game metadata.

## Animations

To create an animation in the Animations tab, press "+" on the animations editable list.

An animation name will be offered based on the current position in the game. Note that you can either change this name. If you create several animations with the same name, they will be stored under separate ids as separate entities ( not recommended ).

![](https://i.imgur.com/aIpBwcP.png)

Now click on the newly created animation, and an other editable list will be created, which will hold the frames of this animation. Press "+" on this one as well. Now you added the first frame to the animation. Make a move and repeat this. Now you have an animation of two frames.

![](https://i.imgur.com/ZrtHz8a.png)

Press the Record button to render the animation. It will be opened in a new tab.

To add an image to a frame, first drag it into the Images tab:

![](https://i.imgur.com/WpZOAPA.png)

Then press the Add to frame button on the image. Before the # tags, enter "Starting position." in the comment box.

The comment to the position now looks something like this:

![](https://i.imgur.com/DluBzW4.png)

It will be rendered like this:

![](https://i.imgur.com/CUlRq42.png)

To add drawings to the frame, for that you have to use a markup.

Examples:

```
#e2 green circle on e2
#e4d4e5d5 green cirles on center squares
#re2 red circle on e2
#we2e4 green arrow from e2 to e4
#we2e4e4e5 green arrows from e2 to e4 and e4 to e5
#wre2e4 red arrow from e2 to e4
```

Tags should come after the text of the comment. For clarity you can use @ to separate drawing kind and options from squares, however using @ is only necessary for images ( since they can have arbitrary names, that can be mistaken for other kind of markup ), #r@e2 is the same as #re2.

Before the sqares of the tag, you can specify options.

opacity ( 0 - 9 ):

```
#wo1@e2e4 very transparent arrow from e2 to e4
#wo9@e2e4 very opaque arrow from e2 to e4
```

thickness ( 0 - 9 ):

```
#wt1@e2e4 very thin arrow from e2 to e4
#wt9@e2e4 very thick arrow from e2 to e4
```

combine options:

```
#wo1t9@e2e4 very transparent thick arrow from e2 to e4
#wo9t1@e2e4 very opaque thin arrow from e2 to e4
```

Note that if you use thickness option on an image, it will set its size.

To use delay other than default delay, you can add:

```
#delay:[delay in milliseconds]
```

When you insert an image, a delay tag will be inserted automatically.
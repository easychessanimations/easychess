#include <stdio.h>
#include <string.h>
#include <stdint.h>

const uint8_t WHITE = 1;
const uint8_t BLACK = 0;

// piece

typedef struct{
	char kind;
	uint8_t color;
} Piece;

const uint8_t NUM_FILES = 8;
const uint8_t LAST_FILE = NUM_FILES - 1;
const uint8_t NUM_RANKS = 8;
const uint8_t LAST_RANK = NUM_RANKS - 1;
const uint8_t BOARD_SIZE = NUM_FILES * NUM_RANKS;

const char* STANDARD_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

typedef struct{
  char variant[100];
	Piece rep[BOARD_SIZE];
  uint8_t turn;
  uint8_t castlingRights[4];
} Board;

Board mainBoard;

char buff[1000];

char* reportBoard(Board* b){
  uint8_t j = 0;
  for(uint8_t i=0; i<BOARD_SIZE; i++){
    buff[j++] = b->rep[i].kind;
    if(i%NUM_FILES == LAST_FILE){
      buff[j++] = '\n';
    }
  }
  strcat(buff, "\nturn : ");
  strcat(buff, b->turn ? "white" : "black");
  strcat(buff, "\ncastling rights : ");
  strcat(buff, b->castlingRights[0] ? "K" : "");
  strcat(buff, b->castlingRights[1] ? "Q" : "");
  strcat(buff, b->castlingRights[2] ? "k" : "");
  strcat(buff, b->castlingRights[3] ? "q" : "");
  if(!(b->castlingRights[0]+b->castlingRights[1]+b->castlingRights[2]+b->castlingRights[3])){
    strcat(buff, "none");
  }
  return buff;
}

void resetBoard(Board* b){
  b->castlingRights[0]=0;
  b->castlingRights[1]=0;
  b->castlingRights[2]=0;
  b->castlingRights[3]=0;
  for(uint8_t i=0; i<BOARD_SIZE; i++){
    b->rep[i] = (Piece){'-', 0};
  }
}

char* setBoardFromFen(Board* b, char *fen, char* variant){
  b->turn = WHITE;  
  strcpy(b->variant, variant);
  resetBoard(b);
  if(strcmp(fen, "startpos") == 0){
    strcpy(fen, STANDARD_START_FEN);
  }
  uint8_t fenIndex = 0;
  uint8_t boardIndex = 0;  
  uint8_t ok = 1;
  char kind;
  while(ok){
    kind = fen[fenIndex];
    if((kind >= 'a') && (kind <= 'z')){
      b->rep[boardIndex++] = (Piece){kind, BLACK};
    }
    if((kind >= 'A') && (kind <= 'Z')){
      b->rep[boardIndex++] = (Piece){kind, WHITE};
    }
    if((kind >= '0') && (kind <= '9')){
      for(uint8_t acc=0; acc < kind - '0'; acc++){
        b->rep[boardIndex++] = (Piece){'-', 0};
      }
    }
    fenIndex++;
    if(fenIndex >= strlen(fen)) ok = 0;        
    if(boardIndex >= BOARD_SIZE) ok = 0;        
    if(kind == ' ') ok = 0;
  }
  if(kind != ' '){    
    fenIndex++;
    b->turn = fen[fenIndex] == 'w' ? WHITE : BLACK;
  }
  ok = 1;
  fenIndex+=2;
  uint8_t castleFexStartIndex = fenIndex; 
  while(ok){
    char cr = fen[fenIndex++];
    if(cr == 'K') b->castlingRights[0] = 1;
    if(cr == 'Q') b->castlingRights[1] = 1;
    if(cr == 'k') b->castlingRights[2] = 1;
    if(cr == 'q') b->castlingRights[3] = 1;
    if(fenIndex >= strlen(fen)) ok = 0;        
  }
  return reportBoard(b);
}

char* setFromFen(char *fen, char* variant){  
  return setBoardFromFen(&mainBoard, fen, variant);
}

int main() {
  printf("WASM board initialized\n");
  return 0;
}


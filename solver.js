var faces="RLFBUD"
var order="AECGBFDHIJKLMSNTROQP"
var bithash="TdXhQaRbEFIJUZfijeYV"
var perm="AIBJTMROCLDKSNQPEKFIMSPRGJHLNTOQAGCEMTNSBFDHORPQ"
var pos = []//20
var ori = []//20
var val = []
var TEMP
var tables = [] //8
var move = [] //20
var moveamount = [] //20
	// current phase being searched (0,2,4,6 for phases 1 to 4)
var phase = 0;
var tablesize = [1, 4096,  6561, 4096,  256, 1536, 13824, 576];
const CHAROFFSET = 65
function SWAP(a,b){
  TEMP=a;
  a=b;
  b=TEMP;
}
function cycle(p,a){
	SWAP(p[a[0]-CHAROFFSET],p[a[1]-CHAROFFSET]);
	SWAP(p[a[0]-CHAROFFSET],p[a[2]-CHAROFFSET]);
	SWAP(p[a[0]-CHAROFFSET],p[a[3]-CHAROFFSET]);
}
function twist(i,a){
	i-=CHAROFFSET;
	ori[i]=(ori[i]+a+1)%val[i];
}
function reset(){
	for( int i=0; i<20; pos[i]=i, ori[i++]=0);
}
function permtonum(p){
	var n=0;
	for ( var a=0; a<4; a++) {
		n *=4-a;
		for( var b=a; ++b<4; )
			if (p[b]<p[a]) n++;
	}
	return n;
}
function numtoperm(p, n, o){
	p+=o;
	p[3]=o;
	for (var a=3; a--;){
		p[a] = n%(4-a) +o;
		n/=4-a;
		for (var b=a; ++b<4; )
			if ( p[b] >= p[a]) p[b]++;
	}
}

// get index of cube position from table t
function getposition(t){
	var i=-1,n=0;
	switch(t){
	case 1:
		for(;++i<12;) n+= ori[i]<<i;
		break;
	case 2:/
		for(i=20;--i>11;) n=n*3+ori[i];
		break;
	case 3:
		for(;++i<12;) n+= (pos[i]&8)?(1<<i):0;
		break;
	case 4:
		for(;++i<8;) n+= (pos[i]&4)?(1<<i):0;
		break;
	case 5:
		int corn[8],j,k,l,corn2[4];
		k=j=0;
		for(;++i<8;)
			if((l=pos[i+12]-12)&4){
				corn[l]=k++;
				n+=1<<i;
			}else corn[j++]=l;
		for(i=0;i<4;i++) corn2[i]=corn[4+corn[i]];
		for(;--i;) corn2[i]^=corn2[0];
		n=n*6+corn2[1]*2-2;
		if(corn2[3]<corn2[2])n++;
		break;
	case 6:
		n=permtonum(pos)*576+permtonum(pos+4)*24+permtonum(pos+12);
		break;
	case 7:
		n=permtonum(pos+8)*24+permtonum(pos+16);
		break;
	}
	return n;
}
function setposition(t, n){
	int i=0,j=12,k=0;
	var corn="QRSTQRTSQSRTQTRSQSTRQTSR";
	reset();
	switch(t){
	case 1:/
		for(;i<12;i++,n>>=1) ori[i]=n&1;
		break;
	case 2:/
		for(i=12;i<20;i++,n/=3) ori[i]=n%3;
		break;
	case 3:
		for(;i<12;i++,n>>=1) pos[i]= 8*n&8;
		break;
	case 4:
		for(;i<8;i++,n>>=1) pos[i]= 4*n&4;
		break;
	case 5:
		corn+=n%6*4;
		n/=6;
		for(;i<8;i++,n>>=1)
			pos[i+12]= n&1 ? corn[k++]-CHAROFFSET : j++;
		break;
	case 6:
		numtoperm(pos,n%24,12);n/=24;
		numtoperm(pos,n%24,4); n/=24;
		numtoperm(pos,n   ,0);
		break;
	case 7:
		numtoperm(pos,n/24,8);
		numtoperm(pos,n%24,16);
		break;
	}
}
function domove( m){
	var p=perm+8*m
  var i=8;
	cycle(pos,p);
	cycle(ori,p);
	cycle(pos,p+4);
	cycle(ori,p+4);
	if(m<4)
		for(;--i>3;) twist(p[i],i&1);
	if(m<2)
		for(i=4;i--;) twist(p[i],0);
}

function filltable(ti){
	var n=1;
  var l=1;
  var tl=tablesize[ti]; 
  tables[ti] = []; //tl
	var tb = tables[ti];
	//clear table
	for(var i=0;i<tl;i++){
   tb[i]=0;
  }
	//mark solved position as depth 1
	reset();
	tb[getposition(ti)]=1;
	
	// while there are positions of depth l
	while(n){
		n=0;
		// find each position of depth l
		for(var i=0;i<tl;i++){
			if( tb[i]==l ){
				//construct that cube position
				setposition(ti,i);
				// try each face any amount
				for( var f=0; f<6; f++){
					for( var q=1;q<4;q++){
						domove(f);
						// get resulting position
						var r=getposition(ti);
						// if move as allowed in that phase, and position is a new one
						if( ( q==2 || f>=(ti&6) ) && !tb[r]){
							// mark that position as depth l+1
							tb[r]=l+1;
							n++;
						}
					}
					domove(f);
				}
			}
		}
		l++;
	}
}
function searchphase(movesleft, movesdone, lastmove){
	if( tables[phase  ][getposition(phase  )]-1 > movesleft ||
	    tables[phase+1][getposition(phase+1)]-1 > movesleft ) return false;
	if(!movesleft) return true;
	for( var i=6;i--;){
		if( i-lastmove && (i-lastmove+1 || i|1 ) ){
			move[movesdone]=i;
			for(var j=0;++j<4;){
				domove(i);
				moveamount[movesdone]=j;
				if( (j==2 || i>=phase ) && searchphase(movesleft-1,movesdone+1,i) ) return true;
			}
			domove(i);
		}
	}
	return false;
}
